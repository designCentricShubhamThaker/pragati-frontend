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
    workbook.creator = 'Order Management System';
    workbook.lastModifiedBy = 'Order Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const colors = {
      primary: 'FF1F4E79',
      secondary: 'FF2E75B6',
      accent1: 'FF5B9BD5',
      accent2: 'FFBDD7EE',
      accent3: 'FFD6E3BC',
      accent4: 'FFFCE4D6',
      white: 'FFFFFFFF',
      lightGray: 'FFF2F2F2',
      mediumGray: 'FFD9D9D9',
      darkGray: 'FF595959',
      black: 'FF000000',
      highlight: 'FFFFC000',
      trackingHeader: 'FF8EA9DB', // Color for tracking headers
      trackingCell: 'FFD9E1F2',   // Color for tracking cells
      trackingDate: 'FFE6EEF8'    // New lighter color for tracking date cells
    };
    const styles = {
      title: {
        font: { bold: true, size: 16, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      sectionHeader: {
        font: { bold: true, size: 12, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      categoryHeader: {
        font: { bold: true, size: 11, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent1 } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      columnHeader: {
        font: { bold: true, size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent2 } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      trackingHeader: {
        font: { bold: true, size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.trackingHeader } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      trackingQtyCell: {
        font: { bold: true, size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.trackingCell } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      trackingDateCell: {
        font: { size: 9, color: { argb: colors.darkGray } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.trackingDate } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      infoLabel: {
        font: { bold: true, size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent3 } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      infoValue: {
        font: { size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent4 } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      dataCellEven: {
        font: { size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGray } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      dataCellOdd: {
        font: { size: 10, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.white } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      footer: {
        font: { italic: true, size: 9, color: { argb: colors.darkGray } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.mediumGray } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: colors.black } },
          bottom: { style: 'thin', color: { argb: colors.black } },
          left: { style: 'thin', color: { argb: colors.black } },
          right: { style: 'thin', color: { argb: colors.black } }
        }
      },
      total: {
        font: { bold: true, size: 11, color: { argb: colors.black } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.highlight } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'medium', color: { argb: colors.black } },
          bottom: { style: 'medium', color: { argb: colors.black } },
          left: { style: 'medium', color: { argb: colors.black } },
          right: { style: 'medium', color: { argb: colors.black } }
        }
      }
    };

    for (const [index, order] of orders.entries()) {
      const wsName = `Order-${order.order_number || index + 1}`;
      await createOrderWorksheet(workbook, wsName, order, styles, colors);
    }
    await createSummaryWorksheet(workbook, orders, styles);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const createOrderWorksheet = async (workbook, name, order, styles, colors) => {
    const worksheet = workbook.addWorksheet(name, {
      properties: { tabColor: { argb: '1F4E79' } }
    });

    // Set up columns with dynamic widths
    const baseColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const maxTrackingEntries = getMaxTrackingEntries(order);
    const totalColumns = baseColumns.length + maxTrackingEntries; // One column per tracking entry

    // Define base column widths
    const columnWidths = [
      { width: 40 },  // A - Item name
      { width: 18 },  // B - Quantity
      { width: 18 },  // C - Completed Qty
      { width: 18 },  // D - Status
      { width: 18 },  // E - Spec 1
      { width: 18 },  // F - Spec 2
      { width: 18 },  // G - Spec 3
      { width: 18 }   // H - Notes
    ];

    // Add additional columns for tracking history (1 column per entry)
    for (let i = 0; i < maxTrackingEntries; i++) {
      columnWidths.push({ width: 18 });
    }

    worksheet.columns = columnWidths;

    const brandRow = worksheet.addRow(['PRAGATI - GLASS', '', '', '', '', '', '', '']);
    brandRow.height = 20;
    worksheet.mergeCells(`A1:${getExcelColumn(totalColumns)}1`);
    brandRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF2E75B6' } };
    brandRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Title Section (row 2) - Now with two sections
    const titleColSplit = Math.floor(totalColumns / 2);
    const titleRow = worksheet.addRow(['ORDER DETAILS REPORT', '', '', '', 'TRACKING HISTORY', '', '', '']);
    titleRow.height = 28;
    for (let i = 1; i <= totalColumns; i++) {
      if (i <= titleColSplit) {
        Object.assign(titleRow.getCell(i), styles.title);
      } else {
        Object.assign(titleRow.getCell(i), {
          ...styles.title,
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } }
        });
      }
    }
    worksheet.mergeCells(`A2:${getExcelColumn(titleColSplit)}2`);
    worksheet.mergeCells(`${getExcelColumn(titleColSplit + 1)}2:${getExcelColumn(totalColumns)}2`);

    worksheet.addRow(['', '', '', '', '', '', '', '']);

    const orderInfoHeaderRow = worksheet.addRow(['ORDER INFORMATION', '', '', '', '', '', '', '']);
    orderInfoHeaderRow.height = 22;
    orderInfoHeaderRow.eachCell((cell) => {
      Object.assign(cell, styles.sectionHeader);
    });
    worksheet.mergeCells(`A4:${getExcelColumn(totalColumns)}4`);

    const orderNumberRow = worksheet.addRow([
      'Order Number:', order.order_number || 'N/A', '', '',
      'Created Date:', new Date(order.created_at).toLocaleString() || 'N/A', '', ''
    ]);
    Object.assign(orderNumberRow.getCell(1), styles.infoLabel);
    Object.assign(orderNumberRow.getCell(2), styles.infoValue);
    worksheet.mergeCells('B5:D5');
    Object.assign(orderNumberRow.getCell(5), styles.infoLabel);
    Object.assign(orderNumberRow.getCell(6), styles.infoValue);
    worksheet.mergeCells('F5:H5');

    const dispatcherRow = worksheet.addRow([
      'Dispatcher:', order.dispatcher_name || 'N/A', '', '',
      'Status:', order.order_status || 'N/A', '', ''
    ]);
    Object.assign(dispatcherRow.getCell(1), styles.infoLabel);
    Object.assign(dispatcherRow.getCell(2), styles.infoValue);
    worksheet.mergeCells('B6:D6');
    Object.assign(dispatcherRow.getCell(5), styles.infoLabel);
    Object.assign(dispatcherRow.getCell(6), styles.infoValue);
    worksheet.mergeCells('F6:H6');

    const customerRow = worksheet.addRow([
      'Customer:', order.customer_name || 'N/A', '', '',
      'Customer ID:', order.customer_id || 'N/A', '', ''
    ]);
    Object.assign(customerRow.getCell(1), styles.infoLabel);
    Object.assign(customerRow.getCell(2), styles.infoValue);
    worksheet.mergeCells('B7:D7');
    Object.assign(customerRow.getCell(5), styles.infoLabel);
    Object.assign(customerRow.getCell(6), styles.infoValue);
    worksheet.mergeCells('F7:H7');

    const notesRow = worksheet.addRow([
      'Notes:', order.notes || 'No additional notes', '', '', '', '', '', ''
    ]);
    Object.assign(notesRow.getCell(1), styles.infoLabel);
    Object.assign(notesRow.getCell(2), styles.infoValue);
    worksheet.mergeCells(`B8:${getExcelColumn(totalColumns)}8`);

    worksheet.addRow(['', '', '', '', '', '', '', '']);

    const categories = [
      { key: 'glass', title: 'GLASS ITEMS' },
      { key: 'caps', title: 'CAP ITEMS' },
      { key: 'boxes', title: 'BOX ITEMS' },
      { key: 'pumps', title: 'PUMP ITEMS' }
    ];

    let currentRow = 10;
// Updated code to use dates as headers instead of "Comp"
// Updated code to use actual entry dates as headers
categories.forEach(category => {
  const categoryItems = order.order_details?.[category.key] || [];

  const categoryHeaderRow = worksheet.addRow([category.title, '', '', '', '', '', '', '']);
  categoryHeaderRow.height = 22;
  categoryHeaderRow.eachCell((cell, colNumber) => {
    if (colNumber <= totalColumns) {
      Object.assign(cell, styles.categoryHeader);
    }
  });
  worksheet.mergeCells(`A${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
  currentRow++;

  if (categoryItems.length > 0) {
    // Create header rows with actual entry dates in tracking section
    const baseHeaders = getCategoryHeaders(category.key);
    const headers = [...baseHeaders];

    // Collect all unique timestamps from completed entries across all items in this category
    const allTimestamps = [];
    categoryItems.forEach(item => {
      const entries = item.team_tracking?.completed_entries || [];
      entries.forEach(entry => {
        if (entry && entry.timestamp) {
          allTimestamps.push(new Date(entry.timestamp));
        }
      });
    });
    
    // Sort timestamps chronologically
    allTimestamps.sort((a, b) => a - b);
    
    // Take only unique dates (by day)
    const uniqueDateMap = {};
    allTimestamps.forEach(date => {
      const dateString = `${date.getDate().toString().padStart(2, '0')}/${
        (date.getMonth() + 1).toString().padStart(2, '0')}/${
        date.getFullYear()}`;
      uniqueDateMap[dateString] = date;
    });
    
    // If no entries found, use default dates starting from today
    if (Object.keys(uniqueDateMap).length === 0) {
      const startDate = new Date();
      for (let i = 0; i < maxTrackingEntries; i++) {
        const headerDate = new Date(startDate);
        headerDate.setDate(startDate.getDate() + i);
        
        const formattedDate = `${headerDate.getDate().toString().padStart(2, '0')}/${
          (headerDate.getMonth() + 1).toString().padStart(2, '0')}/${
          headerDate.getFullYear()}`;
        
        headers.push(formattedDate);
      }
    } else {
      // Use the actual unique dates as headers, limited to maxTrackingEntries
      const uniqueDates = Object.keys(uniqueDateMap).slice(0, maxTrackingEntries);
      uniqueDates.forEach(dateString => {
        headers.push(dateString);
      });
      
      // Fill remaining slots if needed
      if (uniqueDates.length < maxTrackingEntries) {
        const lastDate = new Date(Math.max(...Object.values(uniqueDateMap)));
        for (let i = uniqueDates.length; i < maxTrackingEntries; i++) {
          const nextDate = new Date(lastDate);
          nextDate.setDate(lastDate.getDate() + (i - uniqueDates.length + 1));
          
          const formattedDate = `${nextDate.getDate().toString().padStart(2, '0')}/${
            (nextDate.getMonth() + 1).toString().padStart(2, '0')}/${
            nextDate.getFullYear()}`;
          
          headers.push(formattedDate);
        }
      }
    }

    const columnHeadersRow = worksheet.addRow(headers);
    columnHeadersRow.height = 18;

    // Apply different styles to base headers and tracking headers
    columnHeadersRow.eachCell((cell, colNumber) => {
      if (colNumber <= baseHeaders.length) {
        Object.assign(cell, styles.columnHeader);
      } else {
        Object.assign(cell, styles.trackingHeader);
      }
    });
    currentRow++;

    // For each item, we need two rows: one for the item data and tracking quantities,
    // and another for the tracking dates
    categoryItems.forEach((item, idx) => {
      // Format base item data
      const baseRowData = formatItemRow(item, category.key);

      // Get tracking entries data (quantities)
      const trackingEntries = item.team_tracking?.completed_entries || [];
      const trackingQtyData = [];

      // Add tracking quantity data
      for (let i = 0; i < maxTrackingEntries; i++) {
        const entry = trackingEntries[i];
        trackingQtyData.push(entry ? entry.qty_completed : '');
      }

      // Combine base data with tracking quantities
      const qtyRowData = [...baseRowData, ...trackingQtyData];

      // Create the quantity row (main row for the item)
      const qtyRow = worksheet.addRow(qtyRowData);

      // Apply appropriate styles
      qtyRow.eachCell((cell, colNumber) => {
        if (colNumber <= baseHeaders.length) {
          Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
        } else {
          Object.assign(cell, styles.trackingQtyCell);
        }
      });
      currentRow++;

      // Create the dates row
      const trackingDateData = Array(baseHeaders.length).fill(''); // Empty cells for base columns

      // Add tracking date data
      for (let i = 0; i < maxTrackingEntries; i++) {
        const entry = trackingEntries[i];
        trackingDateData.push(entry ? new Date(entry.timestamp).toLocaleString() : '');
      }

      const dateRow = worksheet.addRow(trackingDateData);

      // Apply tracking date styles to appropriate cells
      dateRow.eachCell((cell, colNumber) => {
        if (colNumber > baseHeaders.length) {
          Object.assign(cell, styles.trackingDateCell);
        }
      });
      currentRow++;
    });

    const totalQty = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalCompletedQty = categoryItems.reduce((sum, item) =>
      sum + (item.team_tracking?.total_completed_qty || 0), 0);

    const categorySummaryRow = worksheet.addRow([
      'CATEGORY TOTAL:',
      `${totalQty} items`,
      `${totalCompletedQty} completed`,
      `${Math.round((totalCompletedQty / totalQty) * 100) || 0}% complete`,
      '', '', '', ''
    ]);

    categorySummaryRow.eachCell((cell, colNumber) => {
      if (colNumber <= 4) {
        Object.assign(cell, styles.total);
      }
    });
    worksheet.mergeCells(`E${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    currentRow++;

  } else {
    const noItemsRow = worksheet.addRow(['No items in this category', '', '', '', '', '', '', '']);
    noItemsRow.eachCell((cell, colNumber) => {
      if (colNumber <= totalColumns) {
        Object.assign(cell, styles.dataCellEven);
      }
    });
    worksheet.mergeCells(`A${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    currentRow++;
  }

  worksheet.addRow(['', '', '', '', '', '', '', '']);
  currentRow++;
});
    // categories.forEach(category  => {
    //   const categoryItems = order.order_details?.[category.key] || [];

    //   const categoryHeaderRow = worksheet.addRow([category.title, '', '', '', '', '', '', '']);
    //   categoryHeaderRow.height = 22;
    //   categoryHeaderRow.eachCell((cell, colNumber) => {
    //     if (colNumber <= totalColumns) {
    //       Object.assign(cell, styles.categoryHeader);
    //     }
    //   });
    //   worksheet.mergeCells(`A${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    //   currentRow++;

    //   if (categoryItems.length > 0) {
    //     // Create header rows with modified tracking section
    //     const baseHeaders = getCategoryHeaders(category.key);
    //     const headers = [...baseHeaders];

    //     // Add tracking history header cells
    //     for (let i = 0; i < maxTrackingEntries; i++) {
    //       headers.push(`Comp${i}`);
    //     }

    //     const columnHeadersRow = worksheet.addRow(headers);
    //     columnHeadersRow.height = 18;

    //     // Apply different styles to base headers and tracking headers
    //     columnHeadersRow.eachCell((cell, colNumber) => {
    //       if (colNumber <= baseHeaders.length) {
    //         Object.assign(cell, styles.columnHeader);
    //       } else {
    //         Object.assign(cell, styles.trackingHeader);
    //       }
    //     });
    //     currentRow++;

    //     // For each item, we need two rows: one for the item data and tracking quantities,
    //     // and another for the tracking dates
    //     categoryItems.forEach((item, idx) => {
    //       // Format base item data
    //       const baseRowData = formatItemRow(item, category.key);

    //       // Get tracking entries data (quantities)
    //       const trackingEntries = item.team_tracking?.completed_entries || [];
    //       const trackingQtyData = [];

    //       // Add tracking quantity data
    //       for (let i = 0; i < maxTrackingEntries; i++) {
    //         const entry = trackingEntries[i];
    //         trackingQtyData.push(entry ? entry.qty_completed : '');
    //       }

    //       // Combine base data with tracking quantities
    //       const qtyRowData = [...baseRowData, ...trackingQtyData];

    //       // Create the quantity row (main row for the item)
    //       const qtyRow = worksheet.addRow(qtyRowData);

    //       // Apply appropriate styles
    //       qtyRow.eachCell((cell, colNumber) => {
    //         if (colNumber <= baseHeaders.length) {
    //           Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
    //         } else {
    //           Object.assign(cell, styles.trackingQtyCell);
    //         }
    //       });
    //       currentRow++;

    //       // Create the dates row
    //       const trackingDateData = Array(baseHeaders.length).fill(''); // Empty cells for base columns

    //       // Add tracking date data
    //       for (let i = 0; i < maxTrackingEntries; i++) {
    //         const entry = trackingEntries[i];
    //         trackingDateData.push(entry ? new Date(entry.timestamp).toLocaleString() : '');
    //       }

    //       const dateRow = worksheet.addRow(trackingDateData);

    //       // Apply tracking date styles to appropriate cells
    //       dateRow.eachCell((cell, colNumber) => {
    //         if (colNumber > baseHeaders.length) {
    //           Object.assign(cell, styles.trackingDateCell);
    //         }
    //       });
    //       currentRow++;
    //     });

    //     const totalQty = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    //     const totalCompletedQty = categoryItems.reduce((sum, item) =>
    //       sum + (item.team_tracking?.total_completed_qty || 0), 0);

    //     const categorySummaryRow = worksheet.addRow([
    //       'CATEGORY TOTAL:',
    //       `${totalQty} items`,
    //       `${totalCompletedQty} completed`,
    //       `${Math.round((totalCompletedQty / totalQty) * 100) || 0}% complete`,
    //       '', '', '', ''
    //     ]);

    //     categorySummaryRow.eachCell((cell, colNumber) => {
    //       if (colNumber <= 4) {
    //         Object.assign(cell, styles.total);
    //       }
    //     });
    //     worksheet.mergeCells(`E${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    //     currentRow++;

    //   } else {
    //     const noItemsRow = worksheet.addRow(['No items in this category', '', '', '', '', '', '', '']);
    //     noItemsRow.eachCell((cell, colNumber) => {
    //       if (colNumber <= totalColumns) {
    //         Object.assign(cell, styles.dataCellEven);
    //       }
    //     });
    //     worksheet.mergeCells(`A${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    //     currentRow++;
    //   }

    //   worksheet.addRow(['', '', '', '', '', '', '', '']);
    //   currentRow++;
    // });

    const orderSummaryHeaderRow = worksheet.addRow(['ORDER SUMMARY', '', '', '', '', '', '', '']);
    orderSummaryHeaderRow.height = 22;
    orderSummaryHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= totalColumns) {
        Object.assign(cell, styles.sectionHeader);
      }
    });
    worksheet.mergeCells(`A${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    currentRow++;

    const allItems = [
      ...(order.order_details?.glass || []),
      ...(order.order_details?.caps || []),
      ...(order.order_details?.boxes || []),
      ...(order.order_details?.pumps || [])
    ];

    const totalItems = allItems.length;
    const totalOrderedQty = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalCompletedQty = allItems.reduce((sum, item) =>
      sum + (item.team_tracking?.total_completed_qty || 0), 0);
    const completionPercentage = Math.round((totalCompletedQty / totalOrderedQty) * 100) || 0;

    const summaryHeaders = worksheet.addRow([
      'Category', 'Items Count', 'Total Quantity', 'Completed Quantity', 'Completion %', '', '', ''
    ]);
    summaryHeaders.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        Object.assign(cell, styles.columnHeader);
      }
    });
    worksheet.mergeCells(`F${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    currentRow++;

    categories.forEach((category, idx) => {
      const categoryItems = order.order_details?.[category.key] || [];
      const itemCount = categoryItems.length;
      const orderedQty = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const completedQty = categoryItems.reduce((sum, item) =>
        sum + (item.team_tracking?.total_completed_qty || 0), 0);
      const categoryCompletion = Math.round((completedQty / orderedQty) * 100) || 0;

      const categorySummaryRow = worksheet.addRow([
        category.title.charAt(0) + category.title.slice(1).toLowerCase(),
        itemCount,
        orderedQty,
        completedQty,
        `${categoryCompletion}%`,
        '', '', ''
      ]);
      categorySummaryRow.eachCell((cell, colNumber) => {
        if (colNumber <= 5) {
          Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
        }
      });
      worksheet.mergeCells(`F${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
      currentRow++;
    });

    const totalSummaryRow = worksheet.addRow([
      'ALL CATEGORIES',
      totalItems,
      totalOrderedQty,
      totalCompletedQty,
      `${completionPercentage}%`,
      '', '', ''
    ]);
    totalSummaryRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        Object.assign(cell, styles.total);
      }
    });
    worksheet.mergeCells(`F${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
    currentRow++;

    worksheet.addRow(['', '', '', '', '', '', '', '']);
    currentRow++;

    const footerRow = worksheet.addRow([
      `Report Generated: ${new Date().toLocaleString()}`, '', '', '', '', '', '', ''
    ]);
    footerRow.eachCell((cell) => {
      Object.assign(cell, styles.footer);
    });
    worksheet.mergeCells(`A${currentRow}:${getExcelColumn(totalColumns)}${currentRow}`);
  };

  const createSummaryWorksheet = async (workbook, orders, styles) => {
    const worksheet = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: '2E75B6' } }
    });

    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 }
    ];

    const titleRow = worksheet.addRow(['ORDERS SUMMARY REPORT', '', '', '', '', '', '', '', '']);
    titleRow.height = 28;
    titleRow.eachCell((cell) => {
      Object.assign(cell, styles.title);
    });
    worksheet.mergeCells('A1:I1');

    worksheet.addRow(['', '', '', '', '', '', '', '', '']);

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
    headersRow.height = 18;
    headersRow.eachCell((cell) => {
      Object.assign(cell, styles.columnHeader);
    });

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
        new Date(order.created_at).toLocaleString() || 'N/A',
        glassCount,
        capsCount,
        boxesCount,
        pumpsCount
      ]);

      dataRow.eachCell((cell) => {
        Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
      });
    });

    worksheet.addRow(['', '', '', '', '', '', '', '', '']);

    const totalGlass = orders.reduce((sum, order) => sum + (order.order_details?.glass?.length || 0), 0);
    const totalCaps = orders.reduce((sum, order) => sum + (order.order_details?.caps?.length || 0), 0);
    const totalBoxes = orders.reduce((sum, order) => sum + (order.order_details?.boxes?.length || 0), 0);
    const totalPumps = orders.reduce((sum, order) => sum + (order.order_details?.pumps?.length || 0), 0);

    const currentRow = worksheet.rowCount + 1;
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

    totalsRow.eachCell((cell) => {
      Object.assign(cell, styles.total);
    });
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);

    await addSummaryChart(worksheet, orders, currentRow + 2);

    const footerStartRow = worksheet.rowCount + 20;
    worksheet.addRow(['', '', '', '', '', '', '', '', '']);

    const footerRow = worksheet.addRow([
      `Report Generated: ${new Date().toLocaleString()}`, '', '', '', '', '', '', '', ''
    ]);
    footerRow.eachCell((cell) => {
      Object.assign(cell, styles.footer);
    });
    worksheet.mergeCells(`A${footerStartRow + 1}:I${footerStartRow + 1}`);
  };

  const addSummaryChart = async (worksheet, orders, startingRow) => {
    const chartTitleRow = worksheet.addRow(['Order Items Distribution', '', '', '', '', '', '', '', '']);
    chartTitleRow.getCell(1).font = { bold: true, size: 12 };
    worksheet.mergeCells(`A${startingRow}:I${startingRow}`);

    const categories = ['Glass', 'Caps', 'Boxes', 'Pumps'];
    const data = [];

    orders.forEach((order, index) => {
      data.push([
        `Order #${order.order_number || index + 1}`,
        order.order_details?.glass?.length || 0,
        order.order_details?.caps?.length || 0,
        order.order_details?.boxes?.length || 0,
        order.order_details?.pumps?.length || 0
      ]);
    });

    const dataStartRow = startingRow + 2;
    worksheet.addRow(['Order', ...categories]);

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    worksheet.addRow(['[Chart would be displayed here]']);
  };

  const getMaxTrackingEntries = (order) => {
    let maxEntries = 0;
    const categories = ['glass', 'caps', 'boxes', 'pumps'];
    categories.forEach(category => {
      const items = order.order_details?.[category] || [];

      items.forEach(item => {
        const entriesCount = item.team_tracking?.completed_entries?.length || 0;
        maxEntries = Math.max(maxEntries, entriesCount);
      });
    });

    return Math.max(maxEntries, 1);
  };

  const getCategoryHeaders = (category) => {
    const baseHeaders = ['Item Name', 'Quantity', 'Completed Qty', 'Status'];

    switch (category) {
      case 'glass':
        return [...baseHeaders, 'Glass Type', 'Size', 'Color', 'Notes'];
      case 'caps':
        return [...baseHeaders, 'Cap Type', 'Material', 'Size', 'Notes'];
      case 'boxes':
        return [...baseHeaders, 'Box Type', 'Dimensions', 'Material', 'Notes'];
      case 'pumps':
        return [...baseHeaders, 'Pump Type', 'Material', 'Size', 'Notes'];
      default:
        return [...baseHeaders, 'Spec 1', 'Spec 2', 'Spec 3', 'Notes'];
    }
  };

  const formatItemRow = (item, category) => {
    switch (category) {
      case 'glass':
        return [
          item.glass_name || 'N/A',
          item.quantity || 0,
          `${item.team_tracking?.total_completed_qty || 0} qty`,
          item.status || 'Pending',
          item.weight || 'N/A',
          item.neck_size || 'N/A',
          item.decoration || item.decoration_details?.type || 'N/A',
          item.notes || ''
        ];
      case 'caps':
        return [
          item.cap_name || 'N/A',
          item.quantity || 0,
          item.team_tracking?.total_completed_qty || 0,
          item.status || 'Pending',
          item.neck_size || 'N/A',
          item.process || 'N/A',
          item.material || 'N/A',
          item.notes || ''
        ];
      case 'boxes':
        return [
          item.box_name || 'N/A',
          item.quantity || 0,
          item.team_tracking?.total_completed_qty || 0,
          item.status || 'Pending',
          item.approval_code || 'N/A',
          item.dimensions || 'N/A',
          item.material || 'N/A',
          item.notes || ''
        ];
      case 'pumps':
        return [
          item.pump_name || 'N/A',
          item.quantity || 0,
          item.team_tracking?.total_completed_qty || 0,
          item.status || 'Pending',
          item.neck_type || 'N/A',
          item.material || 'N/A',
          item.color || 'N/A',
          item.notes || ''
        ];
      default:
        return ['Unknown Category', '', '', '', '', '', '', ''];
    }
  };

  const formatTrackingHistory = (trackingEntries, maxEntries) => {
    const result = [];

    for (let i = 0; i < maxEntries; i++) {
      const entry = trackingEntries[i];
      if (entry) {
        result.push(entry.quantity || 0);
        result.push(new Date(entry.timestamp).toLocaleString() || 'N/A');
      } else {

        result.push('');
        result.push('');
      }
    }
    return result;
  };

  const getExcelColumn = (colNumber) => {
    let dividend = colNumber;
    let columnName = '';
    let modulo;

    while (dividend > 0) {
      modulo = (dividend - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      dividend = Math.floor((dividend - modulo) / 26);
    }
    return columnName;
  };

  return (
    <div>
      <button
      className="flex items-center cursor-pointer justify-center gap-1 bg-[#6B7499] hover:bg-gray-500 text-white py-2 px-4 rounded-sm shadow-md transition-colors duration-200"
      onClick={generateExcel}
      title="Download Order Report"
    >
      <FaDownload size={18} />

    </button>
    </div>
  );
};

export default ExcelDownloadComponent



