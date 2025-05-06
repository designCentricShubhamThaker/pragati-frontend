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
      highlight: 'FFFFC000' 
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
      await createOrderWorksheet(workbook, wsName, order, styles);
    }
    await createSummaryWorksheet(workbook, orders, styles);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const createOrderWorksheet = async (workbook, name, order, styles) => {
    const worksheet = workbook.addWorksheet(name, {
      properties: { tabColor: { argb: '1F4E79' } }
    });

    worksheet.columns = [
      { width: 40 },
      { width: 18 }, 
      { width: 18 }, 
      { width: 18 }, 
      { width: 18 }, 
      { width: 18 }, 
      { width: 18 },
      { width: 18 }  
    ];

    const brandRow = worksheet.addRow(['PRAGATI - GLASS', '', '', '', '', '', '', '']);
    brandRow.height = 20;
    worksheet.mergeCells('A1:H1');
    brandRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF2E75B6' } };
    brandRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Title Section (row 2)
    const titleRow = worksheet.addRow(['ORDER DETAILS REPORT', '', '', '', '', '', '', '']);
    titleRow.height = 28;
    titleRow.eachCell((cell) => {
      Object.assign(cell, styles.title);
    });
    worksheet.mergeCells('A2:H2');
    worksheet.addRow(['', '', '', '', '', '', '', '']);

    const orderInfoHeaderRow = worksheet.addRow(['ORDER INFORMATION', '', '', '', '', '', '', '']);
    orderInfoHeaderRow.height = 22;
    orderInfoHeaderRow.eachCell((cell) => {
      Object.assign(cell, styles.sectionHeader);
    });
    worksheet.mergeCells('A4:H4');

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
    worksheet.mergeCells('B8:H8');

    worksheet.addRow(['', '', '', '', '', '', '', '']);

    const categories = [
      { key: 'glass', title: 'GLASS ITEMS' },
      { key: 'caps', title: 'CAP ITEMS' },
      { key: 'boxes', title: 'BOX ITEMS' },
      { key: 'pumps', title: 'PUMP ITEMS' }
    ];

    let currentRow = 10;

    categories.forEach(category => {
      const categoryItems = order.order_details?.[category.key] || [];

      const categoryHeaderRow = worksheet.addRow([category.title, '', '', '', '', '', '', '']);
      categoryHeaderRow.height = 22;
      categoryHeaderRow.eachCell((cell) => {
        Object.assign(cell, styles.categoryHeader);
      });
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      currentRow++;

      if (categoryItems.length > 0) {
        const headers = getCategoryHeaders(category.key);
        const columnHeadersRow = worksheet.addRow(headers);
        columnHeadersRow.height = 18;
        columnHeadersRow.eachCell((cell) => {
          Object.assign(cell, styles.columnHeader);
        });
        currentRow++;

        categoryItems.forEach((item, idx) => {
          const rowData = formatItemRow(item, category.key);
          const dataRow = worksheet.addRow(rowData);
          dataRow.eachCell((cell) => {
            Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
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
          '',
          '',
          '',
          ''
        ]);
        categorySummaryRow.eachCell((cell, colNumber) => {
          if (colNumber <= 4) {
            Object.assign(cell, styles.total);
          }
        });
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        currentRow++;

      } else {

        const noItemsRow = worksheet.addRow(['No items in this category', '', '', '', '', '', '', '']);
        noItemsRow.eachCell((cell) => {
          Object.assign(cell, styles.dataCellEven);
        });
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        currentRow++;
      }

      worksheet.addRow(['', '', '', '', '', '', '', '']);
      currentRow++;
    });


    const orderSummaryHeaderRow = worksheet.addRow(['ORDER SUMMARY', '', '', '', '', '', '', '']);
    orderSummaryHeaderRow.height = 22;
    orderSummaryHeaderRow.eachCell((cell) => {
      Object.assign(cell, styles.sectionHeader);
    });
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
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
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
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
        '',
        '',
        ''
      ]);
      categorySummaryRow.eachCell((cell, colNumber) => {
        if (colNumber <= 5) {
          Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
        }
      });
      worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
      currentRow++;
    });

    const totalSummaryRow = worksheet.addRow([
      'ALL CATEGORIES',
      totalItems,
      totalOrderedQty,
      totalCompletedQty,
      `${completionPercentage}%`,
      '',
      '',
      ''
    ]);
    totalSummaryRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        Object.assign(cell, styles.total);
      }
    });
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
    currentRow++;

    worksheet.addRow(['', '', '', '', '', '', '', '']);
    currentRow++;

    const footerRow = worksheet.addRow([
      `Report Generated: ${new Date().toLocaleString()}`, '', '', '', '', '', '', ''
    ]);
    footerRow.eachCell((cell) => {
      Object.assign(cell, styles.footer);
    });
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
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

    data.forEach((row, idx) => {
      worksheet.addRow(row);
    });
    const chartDataRange = `B${dataStartRow}:E${dataStartRow + data.length}`;
    worksheet.addRow(['[Chart would be displayed here]']);
  };

  const getCategoryHeaders = (category) => {
    switch (category) {
      case 'glass':
        return [
          'Glass Name',
          'Quantity',
          'Completed Qty',
          'Status',
          'Weight',
          'Neck Size',
          'Decoration',
          'Notes'
        ];
      case 'caps':
        return [
          'Cap Name',
          'Quantity',
          'Completed Qty',
          'Status',
          'Neck Size',
          'Process',
          'Material',
          'Notes'
        ];
      case 'boxes':
        return [
          'Box Name',
          'Quantity',
          'Completed Qty',
          'Status',
          'Approval Code',
          'Dimensions',
          'Material',
          'Notes'
        ];
      case 'pumps':
        return [
          'Pump Name',
          'Quantity',
          'Completed Qty',
          'Status',
          'Neck Type',
          'Material',
          'Color',
          'Notes'
        ];
      default:
        return [
          'Item Name',
          'Quantity',
          'Completed Qty',
          'Status',
          'Specification 1',
          'Specification 2',
          'Specification 3',
          'Notes'
        ];
    }
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
}

export default ExcelDownloadComponent
const formatItemRow = (item, category) => {
  switch (category) {
    case 'glass':
      return [
        item.glass_name || 'N/A',
        item.quantity || 0,
        item.team_tracking?.total_completed_qty || 0,
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




// import React from 'react';
// import { FaDownload } from 'react-icons/fa';
// import ExcelJS from 'exceljs';

// const ExcelDownloadComponent = ({ orders }) => {
//   const generateExcel = async () => {
//     if (!orders || orders.length === 0) {
//       alert('No orders data available to download');
//       return;
//     }
//     try {
//       const excelBlob = await createProfessionalExcel(orders);
//       const url = URL.createObjectURL(excelBlob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `Orders_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url); // Clean up the URL object
//     } catch (error) {
//       console.error("Error generating Excel:", error);
//       alert('Error generating Excel file');
//     }
//   };

//   const createProfessionalExcel = async (orders) => {
//     const workbook = new ExcelJS.Workbook();
//     workbook.creator = 'Order Management System';
//     workbook.lastModifiedBy = 'Order Management System';
//     workbook.created = new Date();
//     workbook.modified = new Date();

//     const colors = {
//       primary: 'FF1F4E79', 
//       secondary: 'FF2E75B6', 
//       accent1: 'FF5B9BD5', 
//       accent2: 'FFBDD7EE', 
//       accent3: 'FFD6E3BC', 
//       accent4: 'FFFCE4D6',
//       historyHeader: 'FF8EA9DB', // New color for history headers
//       historyCell: 'FFE4EFFC', // New color for history cells
//       white: 'FFFFFFFF',
//       lightGray: 'FFF2F2F2',
//       mediumGray: 'FFD9D9D9',
//       darkGray: 'FF595959',
//       black: 'FF000000',
//       highlight: 'FFFFC000' 
//     };
    
//     const styles = {
//       title: {
//         font: { bold: true, size: 16, color: { argb: colors.white } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       sectionHeader: {
//         font: { bold: true, size: 12, color: { argb: colors.white } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
//         alignment: { horizontal: 'left', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       categoryHeader: {
//         font: { bold: true, size: 11, color: { argb: colors.white } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent1 } },
//         alignment: { horizontal: 'left', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       columnHeader: {
//         font: { bold: true, size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent2 } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       historyHeader: {
//         font: { bold: true, size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.historyHeader } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       historyCell: {
//         font: { size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.historyCell } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       infoLabel: {
//         font: { bold: true, size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent3 } },
//         alignment: { horizontal: 'right', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       infoValue: {
//         font: { size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent4 } },
//         alignment: { horizontal: 'left', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       dataCellEven: {
//         font: { size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGray } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       dataCellOdd: {
//         font: { size: 10, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.white } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       footer: {
//         font: { italic: true, size: 9, color: { argb: colors.darkGray } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.mediumGray } },
//         alignment: { horizontal: 'left', vertical: 'middle' },
//         border: {
//           top: { style: 'thin', color: { argb: colors.black } },
//           bottom: { style: 'thin', color: { argb: colors.black } },
//           left: { style: 'thin', color: { argb: colors.black } },
//           right: { style: 'thin', color: { argb: colors.black } }
//         }
//       },
//       total: {
//         font: { bold: true, size: 11, color: { argb: colors.black } },
//         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.highlight } },
//         alignment: { horizontal: 'center', vertical: 'middle' },
//         border: {
//           top: { style: 'medium', color: { argb: colors.black } },
//           bottom: { style: 'medium', color: { argb: colors.black } },
//           left: { style: 'medium', color: { argb: colors.black } },
//           right: { style: 'medium', color: { argb: colors.black } }
//         }
//       }
//     };
    
//     for (const [index, order] of orders.entries()) {
//       const wsName = `Order-${order.order_number || index + 1}`;
//       await createOrderWorksheet(workbook, wsName, order, styles);
//     }
//     await createSummaryWorksheet(workbook, orders, styles);

//     const buffer = await workbook.xlsx.writeBuffer();
//     return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   };

//   const createOrderWorksheet = async (workbook, name, order, styles) => {
//     const worksheet = workbook.addWorksheet(name, {
//       properties: { tabColor: { argb: '1F4E79' } }
//     });

//     // Setting wider column widths to accommodate tracking history
//     worksheet.columns = [
//       { width: 25 },  // Item name column
//       { width: 12 }, 
//       { width: 12 }, 
//       { width: 12 }, 
//       { width: 12 }, 
//       { width: 12 }, 
//       { width: 12 },
//       { width: 12 },
//       // Additional columns for tracking history
//       { width: 18 },  // Tracking history title
//       { width: 14 },  // Date/Time headers
//       { width: 12 },  // Qty headers
//       { width: 14 },  // Date/Time headers
//       { width: 12 },  // Qty headers
//       { width: 14 },  // Date/Time headers 
//       { width: 12 },  // Qty headers
//       { width: 14 },  // Extra space if needed
//       { width: 12 }   // Extra space if needed
//     ];

//     const brandRow = worksheet.addRow(['PRAGATI - GLASS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//     brandRow.height = 20;
//     worksheet.mergeCells('A1:Q1');
//     brandRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF2E75B6' } };
//     brandRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

//     // Title Section (row 2)
//     const titleRow = worksheet.addRow(['ORDER DETAILS REPORT', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//     titleRow.height = 28;
//     titleRow.eachCell((cell) => {
//       Object.assign(cell, styles.title);
//     });
//     worksheet.mergeCells('A2:Q2');
//     worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

//     const orderInfoHeaderRow = worksheet.addRow(['ORDER INFORMATION', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//     orderInfoHeaderRow.height = 22;
//     orderInfoHeaderRow.eachCell((cell) => {
//       Object.assign(cell, styles.sectionHeader);
//     });
//     worksheet.mergeCells('A4:Q4');

//     const orderNumberRow = worksheet.addRow([
//       'Order Number:', order.order_number || 'N/A', '', '', '', '',
//       'Created Date:', new Date(order.created_at).toLocaleString() || 'N/A', '', '', '', '', '', '', '', '', ''
//     ]);
//     Object.assign(orderNumberRow.getCell(1), styles.infoLabel);
//     Object.assign(orderNumberRow.getCell(2), styles.infoValue);
//     worksheet.mergeCells('B5:F5');
//     Object.assign(orderNumberRow.getCell(7), styles.infoLabel);
//     Object.assign(orderNumberRow.getCell(8), styles.infoValue);
//     worksheet.mergeCells('H5:Q5');

//     const dispatcherRow = worksheet.addRow([
//       'Dispatcher:', order.dispatcher_name || 'N/A', '', '', '', '',
//       'Status:', order.order_status || 'N/A', '', '', '', '', '', '', '', '', ''
//     ]);
//     Object.assign(dispatcherRow.getCell(1), styles.infoLabel);
//     Object.assign(dispatcherRow.getCell(2), styles.infoValue);
//     worksheet.mergeCells('B6:F6');
//     Object.assign(dispatcherRow.getCell(7), styles.infoLabel);
//     Object.assign(dispatcherRow.getCell(8), styles.infoValue);
//     worksheet.mergeCells('H6:Q6');

//     const customerRow = worksheet.addRow([
//       'Customer:', order.customer_name || 'N/A', '', '', '', '',
//       'Customer ID:', order.customer_id || 'N/A', '', '', '', '', '', '', '', '', ''
//     ]);
//     Object.assign(customerRow.getCell(1), styles.infoLabel);
//     Object.assign(customerRow.getCell(2), styles.infoValue);
//     worksheet.mergeCells('B7:F7');
//     Object.assign(customerRow.getCell(7), styles.infoLabel);
//     Object.assign(customerRow.getCell(8), styles.infoValue);
//     worksheet.mergeCells('H7:Q7');

//     const notesRow = worksheet.addRow([
//       'Notes:', order.notes || 'No additional notes', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
//     ]);
//     Object.assign(notesRow.getCell(1), styles.infoLabel);
//     Object.assign(notesRow.getCell(2), styles.infoValue);
//     worksheet.mergeCells('B8:Q8');

//     worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

//     const categories = [
//       { key: 'glass', title: 'GLASS ITEMS' },
//       { key: 'caps', title: 'CAP ITEMS' },
//       { key: 'boxes', title: 'BOX ITEMS' },
//       { key: 'pumps', title: 'PUMP ITEMS' }
//     ];

//     let currentRow = 10;

//     categories.forEach(category => {
//       const categoryItems = order.order_details?.[category.key] || [];

//       const categoryHeaderRow = worksheet.addRow([category.title, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//       categoryHeaderRow.height = 22;
//       categoryHeaderRow.eachCell((cell) => {
//         Object.assign(cell, styles.categoryHeader);
//       });
//       worksheet.mergeCells(`A${currentRow}:Q${currentRow}`);
//       currentRow++;

//       if (categoryItems.length > 0) {
//         // Get main item headers
//         const headers = getCategoryHeaders(category.key);
        
//         // Add tracking history header in the same row
//         const fullHeaders = [
//           ...headers,
//           'TRACKING HISTORY'
//         ];
        
//         const columnHeadersRow = worksheet.addRow(fullHeaders);
//         columnHeadersRow.height = 18;
        
//         // Apply styles to main column headers
//         for (let i = 1; i <= headers.length; i++) {
//           Object.assign(columnHeadersRow.getCell(i), styles.columnHeader);
//         }
        
//         // Apply style to tracking history header
//         Object.assign(columnHeadersRow.getCell(headers.length + 1), styles.historyHeader);
//         worksheet.mergeCells(`I${currentRow}:Q${currentRow}`);
        
//         currentRow++;
        
//         // Track which items have tracking history to process
//         let itemsWithTrackingHistory = [];
        
//         // Process regular item data
//         categoryItems.forEach((item, idx) => {
//           const rowData = formatItemRow(item, category.key);
//           const dataRow = worksheet.addRow(rowData);
          
//           // Apply styles to data cells
//           for (let i = 1; i <= rowData.length; i++) {
//             Object.assign(dataRow.getCell(i), idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
//           }
          
//           // Store the current row and the item for later processing of tracking history
//           if (item.team_tracking?.completed_entries?.length > 0) {
//             itemsWithTrackingHistory.push({
//               item,
//               row: currentRow
//             });
//           }
          
//           currentRow++;
//         });
        
//         // Now process tracking history for items that have it
//         itemsWithTrackingHistory.forEach(({ item, row }) => {
//           // Get the tracking entries
//           const trackingEntries = item.team_tracking?.completed_entries || [];
          
//           // Add Date/Time header row for this item's tracking
//           const trackingHeaderRow = worksheet.addRow(['', '', '', '', '', '', '', '', 'Date & Time', 'Qty', 'Date & Time', 'Qty', 'Date & Time', 'Qty', '', '', '']);
          
//           // Style the tracking headers
//           for (let i = 9; i <= 15; i++) {
//             Object.assign(trackingHeaderRow.getCell(i), styles.historyHeader);
//           }
          
//           currentRow++;
          
//           // Add tracking data (up to 3 entries)
//           const trackingDataRow = worksheet.addRow(['', '', '', '', '', '', '', '']);
          
//           // Add tracking data
//           for (let i = 0; i < Math.min(trackingEntries.length, 3); i++) {
//             const entry = trackingEntries[i];
//             const dateTimeCell = 9 + (i * 2);
//             const qtyCell = 10 + (i * 2);
            
//             trackingDataRow.getCell(dateTimeCell).value = new Date(entry.timestamp).toLocaleString();
//             trackingDataRow.getCell(qtyCell).value = entry.qty_completed;
            
//             Object.assign(trackingDataRow.getCell(dateTimeCell), styles.historyCell);
//             Object.assign(trackingDataRow.getCell(qtyCell), styles.historyCell);
//           }
          
//           currentRow++;
          
//           // If there are more than 3 entries, add another row
//           if (trackingEntries.length > 3) {
//             const trackingDataRow2 = worksheet.addRow(['', '', '', '', '', '', '', '']);
            
//             for (let i = 3; i < Math.min(trackingEntries.length, 6); i++) {
//               const entry = trackingEntries[i];
//               const dateTimeCell = 9 + ((i - 3) * 2);
//               const qtyCell = 10 + ((i - 3) * 2);
              
//               trackingDataRow2.getCell(dateTimeCell).value = new Date(entry.timestamp).toLocaleString();
//               trackingDataRow2.getCell(qtyCell).value = entry.qty_completed;
              
//               Object.assign(trackingDataRow2.getCell(dateTimeCell), styles.historyCell);
//               Object.assign(trackingDataRow2.getCell(qtyCell), styles.historyCell);
//             }
            
//             currentRow++;
//           }
          
//           // Add a spacer row after each item's tracking history
//           worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//           currentRow++;
//         });

//         const totalQty = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
//         const totalCompletedQty = categoryItems.reduce((sum, item) =>
//           sum + (item.team_tracking?.total_completed_qty || 0), 0);

//         const categorySummaryRow = worksheet.addRow([
//           'CATEGORY TOTAL:',
//           `${totalQty} items`,
//           `${totalCompletedQty} completed`,
//           `${Math.round((totalCompletedQty / totalQty) * 100) || 0}% complete`,
//           '', '', '', '', '', '', '', '', '', '', '', '', ''
//         ]);
//         categorySummaryRow.eachCell((cell, colNumber) => {
//           if (colNumber <= 4) {
//             Object.assign(cell, styles.total);
//           }
//         });
//         worksheet.mergeCells(`E${currentRow}:Q${currentRow}`);
//         currentRow++;

//       } else {
//         const noItemsRow = worksheet.addRow(['No items in this category', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//         noItemsRow.eachCell((cell) => {
//           Object.assign(cell, styles.dataCellEven);
//         });
//         worksheet.mergeCells(`A${currentRow}:Q${currentRow}`);
//         currentRow++;
//       }

//       worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//       currentRow++;
//     });

//     const orderSummaryHeaderRow = worksheet.addRow(['ORDER SUMMARY', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//     orderSummaryHeaderRow.height = 22;
//     orderSummaryHeaderRow.eachCell((cell) => {
//       Object.assign(cell, styles.sectionHeader);
//     });
//     worksheet.mergeCells(`A${currentRow}:Q${currentRow}`);
//     currentRow++;

//     const allItems = [
//       ...(order.order_details?.glass || []),
//       ...(order.order_details?.caps || []),
//       ...(order.order_details?.boxes || []),
//       ...(order.order_details?.pumps || [])
//     ];

//     const totalItems = allItems.length;
//     const totalOrderedQty = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
//     const totalCompletedQty = allItems.reduce((sum, item) =>
//       sum + (item.team_tracking?.total_completed_qty || 0), 0);
//     const completionPercentage = Math.round((totalCompletedQty / totalOrderedQty) * 100) || 0;

//     const summaryHeaders = worksheet.addRow([
//       'Category', 'Items Count', 'Total Quantity', 'Completed Quantity', 'Completion %', '', '', '', '', '', '', '', '', '', '', '', ''
//     ]);
//     summaryHeaders.eachCell((cell, colNumber) => {
//       if (colNumber <= 5) {
//         Object.assign(cell, styles.columnHeader);
//       }
//     });
//     worksheet.mergeCells(`F${currentRow}:Q${currentRow}`);
//     currentRow++;

//     categories.forEach((category, idx) => {
//       const categoryItems = order.order_details?.[category.key] || [];
//       const itemCount = categoryItems.length;
//       const orderedQty = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
//       const completedQty = categoryItems.reduce((sum, item) =>
//         sum + (item.team_tracking?.total_completed_qty || 0), 0);
//       const categoryCompletion = Math.round((completedQty / orderedQty) * 100) || 0;

//       const categorySummaryRow = worksheet.addRow([
//         category.title.charAt(0) + category.title.slice(1).toLowerCase(),
//         itemCount,
//         orderedQty,
//         completedQty,
//         `${categoryCompletion}%`,
//         '', '', '', '', '', '', '', '', '', '', '', ''
//       ]);
//       categorySummaryRow.eachCell((cell, colNumber) => {
//         if (colNumber <= 5) {
//           Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
//         }
//       });
//       worksheet.mergeCells(`F${currentRow}:Q${currentRow}`);
//       currentRow++;
//     });

//     const totalSummaryRow = worksheet.addRow([
//       'ALL CATEGORIES',
//       totalItems,
//       totalOrderedQty,
//       totalCompletedQty,
//       `${completionPercentage}%`,
//       '', '', '', '', '', '', '', '', '', '', '', ''
//     ]);
//     totalSummaryRow.eachCell((cell, colNumber) => {
//       if (colNumber <= 5) {
//         Object.assign(cell, styles.total);
//       }
//     });
//     worksheet.mergeCells(`F${currentRow}:Q${currentRow}`);
//     currentRow++;

//     worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
//     currentRow++;

//     const footerRow = worksheet.addRow([
//       `Report Generated: ${new Date().toLocaleString()}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
//     ]);
//     footerRow.eachCell((cell) => {
//       Object.assign(cell, styles.footer);
//     });
//     worksheet.mergeCells(`A${currentRow}:Q${currentRow}`);
//   };

//   const createSummaryWorksheet = async (workbook, orders, styles) => {
//     const worksheet = workbook.addWorksheet('Summary', {
//       properties: { tabColor: { argb: '2E75B6' } }
//     });

//     worksheet.columns = [
//       { width: 15 }, 
//       { width: 25 }, 
//       { width: 20 }, 
//       { width: 15 }, 
//       { width: 20 }, 
//       { width: 12 }, 
//       { width: 12 }, 
//       { width: 12 }, 
//       { width: 12 }  
//     ];

//     const titleRow = worksheet.addRow(['ORDERS SUMMARY REPORT', '', '', '', '', '', '', '', '']);
//     titleRow.height = 28;
//     titleRow.eachCell((cell) => {
//       Object.assign(cell, styles.title);
//     });
//     worksheet.mergeCells('A1:I1');

//     worksheet.addRow(['', '', '', '', '', '', '', '', '']);

//     const headersRow = worksheet.addRow([
//       'Order Number',
//       'Customer Name',
//       'Dispatcher',
//       'Status',
//       'Created Date',
//       'Glass Items',
//       'Cap Items',
//       'Box Items',
//       'Pump Items'
//     ]);
//     headersRow.height = 18;
//     headersRow.eachCell((cell) => {
//       Object.assign(cell, styles.columnHeader);
//     });


//     orders.forEach((order, idx) => {
//       const glassCount = order.order_details?.glass?.length || 0;
//       const capsCount = order.order_details?.caps?.length || 0;
//       const boxesCount = order.order_details?.boxes?.length || 0;
//       const pumpsCount = order.order_details?.pumps?.length || 0;

//       const dataRow = worksheet.addRow([
//         order.order_number || 'N/A',
//         order.customer_name || 'N/A',
//         order.dispatcher_name || 'N/A',
//         order.order_status || 'N/A',
//         new Date(order.created_at).toLocaleString() || 'N/A',
//         glassCount,
//         capsCount,
//         boxesCount,
//         pumpsCount
//       ]);

//       dataRow.eachCell((cell) => {
//         Object.assign(cell, idx % 2 === 0 ? styles.dataCellEven : styles.dataCellOdd);
//       });
//     });

//     worksheet.addRow(['', '', '', '', '', '', '', '', '']);

//     const totalGlass = orders.reduce((sum, order) => sum + (order.order_details?.glass?.length || 0), 0);
//     const totalCaps = orders.reduce((sum, order) => sum + (order.order_details?.caps?.length || 0), 0);
//     const totalBoxes = orders.reduce((sum, order) => sum + (order.order_details?.boxes?.length || 0), 0);
//     const totalPumps = orders.reduce((sum, order) => sum + (order.order_details?.pumps?.length || 0), 0);

//     const currentRow = worksheet.rowCount + 1;
//     const totalsRow = worksheet.addRow([
//       'TOTALS',
//       '',
//       '',
//       `Total Orders: ${orders.length}`,
//       '',
//       totalGlass,
//       totalCaps,
//       totalBoxes,
//       totalPumps
//     ]);

//     totalsRow.eachCell((cell) => {
//       Object.assign(cell, styles.total);
//     });
//     worksheet.mergeCells(`A${currentRow}:C${currentRow}`);

//     await addSummaryChart(worksheet, orders, currentRow + 2);

//     const footerStartRow = worksheet.rowCount + 20; 
//     worksheet.addRow(['', '', '', '', '', '', '', '', '']);


//     const footerRow = worksheet.addRow([
//       `Report Generated: ${new Date().toLocaleString()}`, '', '', '', '', '', '', '', ''
//     ]);
//     footerRow.eachCell((cell) => {
//       Object.assign(cell, styles.footer);
//     });
//     worksheet.mergeCells(`A${footerStartRow}:I${footerStartRow}`);
//   };

//   const addSummaryChart = async (worksheet, orders, startRow) => {
//     // Create a stacked column chart manually since worksheet.addChart isn't available
//     // Instead, we'll create a data visualization table with color formatting
    
//     worksheet.addRow(['', '', '', '', '', '', '', '', '']);
//     worksheet.addRow(['ITEMS BY CATEGORY VISUALIZATION', '', '', '', '', '', '', '', '']);
//     const chartTitleRow = worksheet.lastRow;
//     chartTitleRow.height = 24;
//     chartTitleRow.getCell(1).font = { size: 14, bold: true, color: { argb: '2E75B6' } };
//     worksheet.mergeCells(`A${startRow+1}:I${startRow+1}`);
//     chartTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    
//     // Add header for the visualization
//     const chartHeaderRow = worksheet.addRow([
//       'Order Number', 
//       'Glass Items', 
//       'Glass', 
//       'Cap Items', 
//       'Caps', 
//       'Box Items', 
//       'Boxes', 
//       'Pump Items', 
//       'Pumps'
//     ]);
    
//     chartHeaderRow.eachCell((cell) => {
//       cell.font = { bold: true, size: 10, color: { argb: '000000' } };
//       cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
//       cell.alignment = { horizontal: 'center', vertical: 'middle' };
//       cell.border = {
//         top: { style: 'thin', color: { argb: '000000' } },
//         bottom: { style: 'thin', color: { argb: '000000' } },
//         left: { style: 'thin', color: { argb: '000000' } },
//         right: { style: 'thin', color: { argb: '000000' } }
//       };
//     });
    
//     // Set colors for each category
//     const categoryColors = {
//       glass: '5B9BD5',  // Blue
//       caps: '70AD47',   // Green
//       boxes: 'FFC000',  // Yellow
//       pumps: 'ED7D31'   // Orange
//     };
    
//     // Visualization scale factor - how many characters to represent each item
//     const scaleFactor = 2;
    
//     // Add data rows for each order
//     orders.forEach((order, idx) => {
//       const orderNum = order.order_number || `Order ${idx + 1}`;
//       const glassCount = order.order_details?.glass?.length || 0;
//       const capsCount = order.order_details?.caps?.length || 0;
//       const boxesCount = order.order_details?.boxes?.length || 0;
//       const pumpsCount = order.order_details?.pumps?.length || 0;
      
//       // Create visual bars with repeated characters
//       const glassBar = '■'.repeat(Math.min(glassCount * scaleFactor, 50));
//       const capsBar = '■'.repeat(Math.min(capsCount * scaleFactor, 50));
//       const boxesBar = '■'.repeat(Math.min(boxesCount * scaleFactor, 50));
//       const pumpsBar = '■'.repeat(Math.min(pumpsCount * scaleFactor, 50));
      
//       const dataRow = worksheet.addRow([
//         orderNum,
//         glassCount,
//         glassBar,
//         capsCount,
//         capsBar,
//         boxesCount,
//         boxesBar,
//         pumpsCount,
//         pumpsBar
//       ]);
      
//       // Style the row
//       dataRow.eachCell((cell, colNumber) => {
//         cell.alignment = { vertical: 'middle' };
//         cell.border = {
//           top: { style: 'thin', color: { argb: '000000' } },
//           bottom: { style: 'thin', color: { argb: '000000' } },
//           left: { style: 'thin', color: { argb: '000000' } },
//           right: { style: 'thin', color: { argb: '000000' } }
//         };
        
//         // Apply colors to the bar columns
//         if (colNumber === 3) {
//           cell.font = { color: { argb: categoryColors.glass } };
//         } else if (colNumber === 5) {
//           cell.font = { color: { argb: categoryColors.caps } };
//         } else if (colNumber === 7) {
//           cell.font = { color: { argb: categoryColors.boxes } };
//         } else if (colNumber === 9) {
//           cell.font = { color: { argb: categoryColors.pumps } };
//         }
//       });
//     });
    
//     // Add legend
//     worksheet.addRow(['', '', '', '', '', '', '', '', '']);
//     const legendRow = worksheet.addRow(['Legend:', '', '', '', '', '', '', '', '']);
    
//     const colorLegendRow = worksheet.addRow([
//       '■ Glass Items (Blue)',
//       '',
//       '■ Cap Items (Green)',
//       '',
//       '■ Box Items (Yellow)',
//       '',
//       '■ Pump Items (Orange)',
//       '',
//       ''
//     ]);
    
//     colorLegendRow.getCell(1).font = { color: { argb: categoryColors.glass } };
//     colorLegendRow.getCell(3).font = { color: { argb: categoryColors.caps } };
//     colorLegendRow.getCell(5).font = { color: { argb: categoryColors.boxes } };
//     colorLegendRow.getCell(7).font = { color: { argb: categoryColors.pumps } };
    
//     // Add note about the visualization
//     worksheet.addRow(['', '', '', '', '', '', '', '', '']);
//     const noteRow = worksheet.addRow([
//       'Note: Each ■ symbol represents approximately ' + (1/scaleFactor) + ' items',
//       '', '', '', '', '', '', '', ''
//     ]);
//     worksheet.mergeCells(`A${worksheet.rowCount}:I${worksheet.rowCount}`);
//   };

//   const getCategoryHeaders = (categoryKey) => {
//     const commonHeaders = ['Item Name', 'Item ID', 'Quantity', 'Completed', 'Remaining', 'Completion %', 'Status', ''];
    
//     return commonHeaders;
//   };

//   const formatItemRow = (item, categoryKey) => {
//     const completedQty = item.team_tracking?.total_completed_qty || 0;
//     const remainingQty = Math.max(0, (item.quantity || 0) - completedQty);
//     const completionPercent = item.quantity ? Math.round((completedQty / item.quantity) * 100) : 0;
//     const status = completionPercent === 100 ? 'Complete' : completionPercent > 0 ? 'In Progress' : 'Not Started';
    
//     return [
//       item.name || 'N/A',
//       item.id || 'N/A',
//       item.quantity || 0,
//       completedQty,
//       remainingQty,
//       `${completionPercent}%`,
//       status,
//       ''
//     ];
//   };

//   return (
//     <button 
//       className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
//       onClick={generateExcel}
//     >
//       <FaDownload className="mr-2" />
//       Download Excel Report
//     </button>
//   );
// };

// export default ExcelDownloadComponent;