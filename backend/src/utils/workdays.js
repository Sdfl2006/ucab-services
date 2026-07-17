/**
 * Calcula los días hábiles transcurridos entre dos fechas.
 * Excluye sábados y domingos.
 * @param {Date|String} startDate 
 * @param {Date|String} endDate 
 * @param {Array<String>} holidays - Array opcional de feriados ['YYYY-MM-DD']
 * @returns {Number} Total de días hábiles
 */
const calculateBusinessDays = (startDate, endDate, holidays = []) => {
    let count = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    // Normalizar a medianoche para evitar saltos por zona horaria
    currentDate.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const holidaySet = new Set(holidays);

    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 6 = Sábado
        const formattedDate = currentDate.toISOString().split('T')[0];

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(formattedDate)) {
            count++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
};

module.exports = { calculateBusinessDays };