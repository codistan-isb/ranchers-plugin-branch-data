import moment from 'moment-timezone';
export default async function checkIfTime(startTime,endTime) {
    startTime = startTime||"11:45 AM"; // Start time
    endTime = endTime||"01:00 AM"; // End time on the next day
    const pakistanDate = moment().tz('Asia/Karachi'); // Get current Pakistan time
    const currentTime = pakistanDate; // Use the full moment object

    console.log("pakistanDate:", pakistanDate.format());
    console.log("currentTime:", currentTime.format());

    // Parse startMoment and endMoment
    let startMoment = moment.tz(
        `${pakistanDate.format('YYYY-MM-DD')} ${startTime}`,
        'YYYY-MM-DD hh:mm A',
        'Asia/Karachi'
    );

    let endMoment = moment.tz(
        `${pakistanDate.format('YYYY-MM-DD')} ${endTime}`,
        'YYYY-MM-DD hh:mm A',
        'Asia/Karachi'
    );

    console.log("startMoment (before adjustment):", startMoment.format());
    console.log("endMoment (before adjustment):", endMoment.format());

    // If end time is earlier than start time, adjust endMoment to the next day
    if (endMoment.isBefore(startMoment)) {
        endMoment.add(1, 'day');
    }

    console.log("startMoment (after adjustment):", startMoment.format());
    console.log("endMoment (after adjustment):", endMoment.format());

    // Check if the current time is within the range
    const isInRange = currentTime.isBetween(startMoment, endMoment);

    console.log("isInRange:", isInRange);
    console.log("currentTime ", currentTime)
    console.log("currentTime.format() ", currentTime.format())
    return isInRange
}
