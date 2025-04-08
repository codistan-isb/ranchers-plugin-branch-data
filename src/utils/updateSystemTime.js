import moment from 'moment';

export default async function updateSystemTime(allBranchDetails, ContentDetail) {
    // Find the minimum start time and maximum end time
    let minStartTime = null;
    let maxEndTime = null;

    allBranchDetails.forEach(branch => {
        if (!branch.Timing) return; // Skip if no timing data

        const timeParts = branch.Timing.split(' - ');
        if (timeParts.length !== 2) return; // Skip if format is unexpected

        const branchStartTime = timeParts[0].trim();
        const branchEndTime = timeParts[1].trim();

        // Convert to 24-hour format for accurate comparison
        let startTime24Hour = moment(branchStartTime, ["h:mmA", "hh:mmA"]).format("HH:mm");
        let endTime24Hour = moment(branchEndTime, ["h:mmA", "hh:mmA"]).format("HH:mm");

        // Handle times past midnight (early morning hours)
        // If end time appears earlier than start time, it's likely past midnight
        const startHour = parseInt(startTime24Hour.split(':')[0]);
        const endHour = parseInt(endTime24Hour.split(':')[0]);

        // For comparison purposes, add 24 hours to times past midnight (like 1:45AM)
        const isPastMidnight = endHour < startHour;
        const endTimeForComparison = isPastMidnight ?
            moment(endTime24Hour, "HH:mm").add(24, 'hours').format("HH:mm") :
            endTime24Hour;

        // Set the minimum start time
        if (!minStartTime || moment(startTime24Hour, "HH:mm").isBefore(moment(minStartTime, "HH:mm"))) {
            minStartTime = branchStartTime;
        }

        // Set the maximum end time (accounting for past midnight)
        if (!maxEndTime) {
            maxEndTime = branchEndTime;
        } else {
            const currentMaxEndHour = parseInt(moment(maxEndTime, ["h:mmA", "hh:mmA"]).format("HH:mm").split(':')[0]);
            const isCurrentMaxPastMidnight = currentMaxEndHour < startHour;

            const currentMaxForComparison = isCurrentMaxPastMidnight ?
                moment(moment(maxEndTime, ["h:mmA", "hh:mmA"]).format("HH:mm"), "HH:mm").add(24, 'hours').format("HH:mm") :
                moment(maxEndTime, ["h:mmA", "hh:mmA"]).format("HH:mm");

            if (isPastMidnight && !isCurrentMaxPastMidnight) {
                // If new time is past midnight but current max is not, new time is later
                maxEndTime = branchEndTime;
            } else if (!isPastMidnight && isCurrentMaxPastMidnight) {
                // If current max is past midnight but new time is not, keep current max
            } else if (moment(endTimeForComparison, "HH:mm").isAfter(moment(currentMaxForComparison, "HH:mm"))) {
                // Normal comparison with adjusted times
                maxEndTime = branchEndTime;
            }
        }
    });

    // Fetch the ContentDetail
    const contentDetail = await ContentDetail.findOne({}); // Assuming you need the first record, or you can modify to select a specific one

    if (contentDetail) {
        console.log("minStartTime ", minStartTime);
        console.log("maxEndTime ", maxEndTime);

        // Update the ContentDetail with the new times
        await ContentDetail.updateOne(
            { _id: contentDetail._id },
            {
                $set: {
                    startTime: minStartTime,
                    endTime: maxEndTime
                }
            }
        );

        console.log(`ContentDetail updated with startTime: ${minStartTime} and endTime: ${maxEndTime}`);
    } else {
        console.log("ContentDetail not found.");
    }

}
