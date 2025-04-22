
export const determineTeamType = (input) => {

  if (typeof input === 'string') {
    const teamNameLower = input.toLowerCase();
    if (teamNameLower.includes('glass')) return 'glass';
    if (teamNameLower.includes('cap')) return 'caps';
    if (teamNameLower.includes('box')) return 'boxes';
    if (teamNameLower.includes('pump')) return 'pumps';
    return 'unknown';
  }

  else if (input?.order_details) {
    if (input?.order_details?.glass?.length > 0) return 'glass';
    if (input?.order_details?.caps?.length > 0) return 'caps';
    if (input?.order_details?.boxes?.length > 0) return 'boxes';
    if (input?.order_details?.pumps?.length > 0) return 'pumps';
    return 'unknown';
  }

  return 'unknown';
};

export const getOrderItems = (order, teamType) => {
  switch (teamType) {
    case 'glass': return order?.order_details?.glass || [];
    case 'caps': return order?.order_details?.caps || [];
    case 'boxes': return order?.order_details?.boxes || [];
    case 'pumps': return order?.order_details?.pumps || [];
    default: return [];
  }
};

export const getItemName = (item, teamType) => {
  switch (teamType) {
    case 'glass': return item.glass_name;
    case 'caps': return item.cap_name;
    case 'boxes': return item.box_name;
    case 'pumps': return item.pump_name;
    default: return 'Unknown Item';
  }
};


export const getTeamTypeSpecificColumns = (teamType) => {
  switch (teamType) {
    case 'glass': return [
      { key: 'weight', label: 'Weight' },
      { key: 'neck_size', label: 'Neck Size' },
      { key: 'decoration', label: 'Deco' },
      { key: 'decoration_no', label: 'Deco No' },
    ];
    case 'caps': return [
      { key: 'neck_size', label: 'Neck Size' },
      { key: 'material', label: 'Material' }
    ];
    case 'boxes': return [
      { key: 'approval_code', label: 'Approval Code' }
    ];
    case 'pumps': return [
      { key: 'neck_type', label: 'Neck Type' }
    ];
    default: return [];
  }
};

export const getCellValue = (item, column) => item[column.key] || 'N/A';