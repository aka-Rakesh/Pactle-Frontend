export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getTimeRangeDates = (timeRange: string): { startDate?: string; endDate?: string } => {
  const now = new Date();
  const endDate = formatDateForAPI(now);
  
  switch (timeRange) {
    case '7days':
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: formatDateForAPI(sevenDaysAgo),
        endDate,
      };
    case '30days':
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: formatDateForAPI(thirtyDaysAgo),
        endDate,
      };
    case '4months':
      const fourMonthsAgo = new Date(now.getTime() - 4 * 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: formatDateForAPI(fourMonthsAgo),
        endDate,
      };
    default:
      return { endDate };
  }
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startFormatted = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const endFormatted = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  return `${startFormatted} - ${endFormatted}`;
};

export const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}; 