import React from 'react';
import { FaDownload } from 'react-icons/fa';
import ExcelJS from 'exceljs';

const ExcelDownloadComponent = ({ orders }) => {
  const generateExcel = async () => {
    if (!orders || orders.length === 0) {
      alert('No orders data available to download');
      return;
    }
    try {
      const excelBlob = await createProfessionalExcel(orders);
      const url = URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Orders_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert('Error generating Excel file');
    }
  };

  const createProfessionalExcel = async (orders) => {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Order Management System';
    workbook.lastModifiedBy = 'Order Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Define color palette
    const colors = {
      headerBlue: 'FF9CC2E5',      // Light blue for headers
      subHeaderBlue: 'FFBDD7EE',   // Lighter blue for subheaders
      categoryYellow: 'FFFFD966',  // Yellow for category headers
      totalYellow: 'FFFFC000',     // Darker yellow for totals
      white: 'FFFFFFFF',           // White for alternate rows
      lightGray: 'FFF2F2F2',       // Light gray for alternate rows
      borderGray: 'FFD9D9D9',      // Gray for borders
      black: 'FF000000',           // Black for text and borders
      trackingCell: 'FFDCE6F2',    // Light blue for tracking cells
      trackingDate: 'FFE6EEF8',    // Very light blue for date cells
      completedGreen: 'FF92D050',  // Green for completed status
      sectionHeader: 'FFD8E4BC'    // Tan for section headers
    };

    // Process each order
    for (const [index, order] of orders.entries()) {
      // Create worksheet for each order
      const wsName = `Order-${order.order_number || index + 1}`;
      const worksheet = workbook.addWorksheet(wsName, {
        properties: { tabColor: { argb: 'FF1F4E79' } }
      });

      // Define base columns
      const baseColumns = [
        { header: 'Item Name', key: 'itemName', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 15 },
        { header: 'Completed Qty', key: 'completedQty', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Size/Neck Size', key: 'size', width: 15 },
        { header: 'Decoration/Type', key: 'decoration', width: 15 }
      ];

      // Process each category of items
      const categories = [
        { key: 'glass', title: 'GLASS' },
        { key: 'caps', title: 'CAP' },
        { key: 'boxes', title: 'BOX' },
        { key: 'pumps', title: 'PUMP' }
      ];

      // For each category, create a section
      categories.forEach(category => {
        const categoryItems = order.order_details?.[category.key] || [];
        
        // Skip if no items
        if (categoryItems.length === 0) return;
        
        // Determine how many tracking entries we have across all items
        const maxTrackingEntries = getMaxTrackingEntries(categoryItems);
        
        // Calculate total columns needed
        const totalColumns = baseColumns.length + maxTrackingEntries;
        
        // Set dynamic columns widths
        const allColumns = [...baseColumns];
        for (let i = 0; i < maxTrackingEntries; i++) {
          allColumns.push({ width: 12 }); // Standard width for tracking cells
        }
        worksheet.columns = allColumns;
        
        // ROW 1: Category Header
        const categoryRow = worksheet.addRow([category.title]);
        formatCategoryHeader(worksheet, categoryRow, colors, totalColumns);
        
        // ROW 2: Section Headers (ORDER DETAILS and TRACKING HISTORY)
        const sectionHeaderRow = worksheet.addRow([]);
        
        // Order Details section header
        const orderDetailsCell = sectionHeaderRow.getCell(1);
        orderDetailsCell.value = 'ORDER DETAILS';
        orderDetailsCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.sectionHeader }
        };
        orderDetailsCell.font = { bold: true, size: 11 };
        orderDetailsCell.alignment = { horizontal: 'center', vertical: 'middle' };
        orderDetailsCell.border = createBorders(colors.black);
        
        // Merge cells for Order Details header
        worksheet.mergeCells(`A${sectionHeaderRow.number}:${getColumnLetter(baseColumns.length)}${sectionHeaderRow.number}`);
        
        // Tracking History section header (if there are tracking entries)
        if (maxTrackingEntries > 0) {
          const trackingHistoryCell = sectionHeaderRow.getCell(baseColumns.length + 1);
          trackingHistoryCell.value = 'TRACKING HISTORY';
          trackingHistoryCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors.sectionHeader }
          };
          trackingHistoryCell.font = { bold: true, size: 11 };
          trackingHistoryCell.alignment = { horizontal: 'center', vertical: 'middle' };
          trackingHistoryCell.border = createBorders(colors.black);
          
          // Merge cells for Tracking History header
          if (maxTrackingEntries > 0) {
            const startCol = baseColumns.length + 1;
            const endCol = totalColumns;
            worksheet.mergeCells(`${getColumnLetter(startCol)}${sectionHeaderRow.number}:${getColumnLetter(endCol)}${sectionHeaderRow.number}`);
          }
        }
        
        sectionHeaderRow.height = 20;
        
        // ROW 3: Headers for order details and tracking
        const headerRow = worksheet.addRow([]);
        
        // Add order details headers
        baseColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = col.header;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors.subHeaderBlue }
          };
          cell.font = { bold: true, size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = createBorders(colors.black);
        });
        
        // Add tracking headers
        if (maxTrackingEntries > 0) {
          for (let i = 0; i < maxTrackingEntries; i++) {
            const trackingHeaderCell = headerRow.getCell(baseColumns.length + i + 1);
            trackingHeaderCell.value = `Tracking ${i + 1}`;
            trackingHeaderCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: colors.subHeaderBlue }
            };
            trackingHeaderCell.font = { bold: true, size: 11 };
            trackingHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
            trackingHeaderCell.border = createBorders(colors.black);
          }
        }
        
        headerRow.height = 18;
        
        // Data rows for each item
        categoryItems.forEach((item, idx) => {
          const dataRow = worksheet.addRow([]);
          
          // Add base item data
          let itemData = [];
          
          // Handle different item types
          if (category.key === 'glass') {
            itemData = [
              item.glass_name || 'N/A',
              item.quantity || 0,
              item.team_tracking?.total_completed_qty || 0,
              item.team_tracking?.status || item.status || 'Pending',
              item.neck_size || item.weight || 'N/A',
              item.decoration || (item.decoration_details?.type || 'N/A')
            ];
          } else if (category.key === 'boxes') {
            itemData = [
              item.box_name || 'N/A',
              item.quantity || 0,
              item.team_tracking?.total_completed_qty || 0,
              item.team_tracking?.status || item.status || 'Pending',
              'N/A',
              item.approval_code || 'N/A'
            ];
          } else if (category.key === 'pumps') {
            itemData = [
              item.pump_name || 'N/A',
              item.quantity || 0,
              item.team_tracking?.total_completed_qty || 0,
              item.team_tracking?.status || item.status || 'Pending',
              item.neck_type || 'N/A',
              'N/A'
            ];
          } else {
            // Generic case for other item types
            itemData = [
              item.item_name || 'N/A',
              item.quantity || 0,
              item.team_tracking?.total_completed_qty || 0,
              item.team_tracking?.status || item.status || 'Pending',
              item.size || 'N/A',
              item.type || 'N/A'
            ];
          }
          
          // Apply item data to row
          for (let i = 0; i < itemData.length; i++) {
            const cell = dataRow.getCell(i + 1);
            cell.value = itemData[i];
            
            // Base styling
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: idx % 2 === 0 ? colors.white : colors.lightGray }
            };
            
            // Special styling for status cell
            if (i === 3) { // Status column
              const status = cell.value;
              if (status === 'Completed' || status === '100% complete' || 
                  (typeof status === 'string' && status.toLowerCase().includes('complete'))) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: colors.completedGreen }
                };
              }
            }
            
            cell.font = { size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = createBorders(colors.borderGray);
          }

          // Add tracking data for this item on the same row
          const trackingEntries = item.team_tracking?.completed_entries || [];
          
          if (trackingEntries.length > 0) {
            // Loop through each tracking entry and add to the same row
            for (let i = 0; i < trackingEntries.length && i < maxTrackingEntries; i++) {
              const entry = trackingEntries[i];
              if (!entry) continue;
              
              // Calculate column for this tracking entry
              const trackingColIndex = baseColumns.length + i + 1;
              
              // Format date/time and completed quantity
              let dateValue = '';
              if (entry.timestamp) {
                const date = new Date(entry.timestamp);
                dateValue = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              }
              
              // Add date and qty information in the same cell
              const trackingCell = dataRow.getCell(trackingColIndex);
              trackingCell.value = `${dateValue}\n${entry.qty_completed || 0}`;
              
              trackingCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: idx % 2 === 0 ? colors.trackingDate : colors.trackingCell }
              };
              trackingCell.font = { size: 10 };
              trackingCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              trackingCell.border = createBorders(colors.borderGray);
            }
          }
          
          dataRow.height = 35; 
          dataRow.width = 45
        });
        
        const totalQty = categoryItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        const totalCompletedQty = categoryItems.reduce((sum, item) => 
          sum + (parseInt(item.team_tracking?.total_completed_qty) || 0), 0);
        
        const totalRow = worksheet.addRow([]);
      
        totalRow.getCell(1).value = 'CATEGORY TOTAL:';
        totalRow.getCell(2).value = `${totalQty} items`;
        totalRow.getCell(3).value = `${totalCompletedQty} completed`;
        totalRow.getCell(4).value = `${Math.round((totalCompletedQty / (totalQty || 1)) * 100) || 0}% complete`;
        
        for (let i = 1; i <= baseColumns.length; i++) {
          const cell = totalRow.getCell(i);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors.totalYellow }
          };
          cell.font = { bold: true, size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = createBorders(colors.black);
        }
      
        if (maxTrackingEntries > 0) {
          const trackingTotalCell = totalRow.getCell(baseColumns.length + 1);
          trackingTotalCell.value = 'Tracking Complete';
          trackingTotalCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors.totalYellow }
          };
          trackingTotalCell.font = { bold: true, size: 11 };
          trackingTotalCell.alignment = { horizontal: 'center', vertical: 'middle' };
          trackingTotalCell.border = createBorders(colors.black); 
          const startCol = baseColumns.length + 1;
          const endCol = totalColumns;
          if (endCol > startCol) {
            worksheet.mergeCells(`${getColumnLetter(startCol)}${totalRow.number}:${getColumnLetter(endCol)}${totalRow.number}`);
          }
        }
        totalRow.height = 18;
        worksheet.addRow([]);
      });
    }
    await createSummaryWorksheet(workbook, orders, colors);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };
  

  const createBorders = (colorArgb) => {
    return {
      top: { style: 'thin', color: { argb: colorArgb } },
      left: { style: 'thin', color: { argb: colorArgb } },
      right: { style: 'thin', color: { argb: colorArgb } },
      bottom: { style: 'thin', color: { argb: colorArgb } }
    };
  };
  
  const getMaxTrackingEntries = (items) => {
    let maxEntries = 0;
    items.forEach(item => {
      const entriesCount = item.team_tracking?.completed_entries?.length || 0;
      if (entriesCount > maxEntries) {
        maxEntries = entriesCount;
      }
    });
    return maxEntries;
  };
  
  const formatCategoryHeader = (worksheet, row, colors, totalColumns) => {
    const cell = row.getCell(1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.headerBlue }
    };
    cell.font = { bold: true, size: 12 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = createBorders(colors.black);
    
    worksheet.mergeCells(`A${row.number}:${getColumnLetter(totalColumns)}${row.number}`);
    
    row.height = 20;
  };
  
  const createSummaryWorksheet = async (workbook, orders, colors) => {
    const worksheet = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: 'FF2E75B6' } }
    });
    
    // Set column widths
    worksheet.columns = [
      { width: 15 },  // Order Number
      { width: 25 },  // Customer Name
      { width: 20 },  // Dispatcher
      { width: 15 },  // Status
      { width: 20 },  // Created Date
      { width: 12 },  // Glass Items
      { width: 12 },  // Cap Items
      { width: 12 },  // Box Items
      { width: 12 }   // Pump Items
    ];
    
    // Add title
    const titleRow = worksheet.addRow(['ORDERS SUMMARY REPORT']);
    titleRow.height = 28;
    
    worksheet.mergeCells('A1:I1');
    
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.headerBlue }
    };
    titleRow.getCell(1).font = { bold: true, size: 16 };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add blank row
    worksheet.addRow([]);
    
    // Add headers
    const headersRow = worksheet.addRow([
      'Order Number',
      'Customer Name',
      'Dispatcher',
      'Status',
      'Created Date',
      'Glass Items',
      'Cap Items',
      'Box Items',
      'Pump Items'
    ]);
    
    headersRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.subHeaderBlue }
      };
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = createBorders(colors.black);
    });
    
    // Add data rows
    orders.forEach((order, idx) => {
      const glassCount = order.order_details?.glass?.length || 0;
      const capsCount = order.order_details?.caps?.length || 0;
      const boxesCount = order.order_details?.boxes?.length || 0;
      const pumpsCount = order.order_details?.pumps?.length || 0;
      
      const dataRow = worksheet.addRow([
        order.order_number || 'N/A',
        order.customer_name || 'N/A',
        order.dispatcher_name || 'N/A',
        order.order_status || 'N/A',
        new Date(order.created_at || Date.now()).toLocaleString(),
        glassCount,
        capsCount,
        boxesCount,
        pumpsCount
      ]);
      
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 0 ? colors.white : colors.lightGray }
        };
        cell.font = { size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = createBorders(colors.borderGray);
      });
    });
    
    // Add totals row
    worksheet.addRow([]);
    
    const totalGlass = orders.reduce((sum, order) => sum + (order.order_details?.glass?.length || 0), 0);
    const totalCaps = orders.reduce((sum, order) => sum + (order.order_details?.caps?.length || 0), 0);
    const totalBoxes = orders.reduce((sum, order) => sum + (order.order_details?.boxes?.length || 0), 0);
    const totalPumps = orders.reduce((sum, order) => sum + (order.order_details?.pumps?.length || 0), 0);
    
    const totalsRow = worksheet.addRow([
      'TOTALS',
      '',
      '',
      `Total Orders: ${orders.length}`,
      '',
      totalGlass,
      totalCaps,
      totalBoxes,
      totalPumps
    ]);
    
    worksheet.mergeCells(`A${totalsRow.number}:C${totalsRow.number}`);
    
    totalsRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.totalYellow }
      };
      cell.font = { bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = createBorders(colors.black);
    });
    
    // Add footer
    worksheet.addRow([]);
    worksheet.addRow([]);
    
    const footerRow = worksheet.addRow([
      `Report Generated: ${new Date().toLocaleString()}`
    ]);
    
    worksheet.mergeCells(`A${footerRow.number}:I${footerRow.number}`);
    
    footerRow.getCell(1).font = { italic: true, size: 9, color: { argb: '595959' } };
  };
  
  const getColumnLetter = (colIndex) => {
    let temp, letter = '';
    
    while (colIndex > 0) {
      temp = (colIndex - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      colIndex = (colIndex - temp - 1) / 26;
    }
    
    return letter;
  };

  return (
    <button
    className="flex items-center cursor-pointer justify-center gap-1 bg-[#6B7499] hover:bg-gray-500 text-white py-2 px-4 rounded-sm shadow-md transition-colors duration-200"
    onClick={generateExcel}
    title="Download Order Report"
  >
    <FaDownload size={18} />

  </button>
  );
};

export default ExcelDownloadComponent;