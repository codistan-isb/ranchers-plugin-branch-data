import moment from 'moment'; // Optional, use if you want to handle time parsing robustly

export default async function updateSystemTime(allBranchDetails, ContentDetail) {
    // Find the minimum start time and maximum end time
    let minStartTime = null;
    let maxEndTime = null;

    allBranchDetails.forEach(branch => {
        const branchStartTime = branch.Timing.split(' - ')[0]; // Assuming start time is before ' - '
        const branchEndTime = branch.Timing.split(' - ')[1]; // Assuming end time is after ' - '

        // Convert to 24-hour format using moment.js (or use custom logic)
        const startTime24Hour = moment(branchStartTime, ["hh:mmA"]).format("HH:mm");
        const endTime24Hour = moment(branchEndTime, ["hh:mmA"]).format("HH:mm");

        // Set the minimum start time
        if (!minStartTime || moment(startTime24Hour, "HH:mm") < moment(minStartTime, "HH:mm")) {
            minStartTime = startTime24Hour;
        }

        // Set the maximum end time
        if (!maxEndTime || moment(endTime24Hour, "HH:mm") > moment(maxEndTime, "HH:mm")) {
            maxEndTime = endTime24Hour;
        }
    });

    // Fetch the ContentDetail
    const contentDetail = await ContentDetail.findOne({}); // Assuming you need the first record, or you can modify to select a specific one

    if (contentDetail) {
        console.log("minStartTime ", minStartTime);
        console.log("maxEndTime ", maxEndTime);
        
        // Update the ContentDetail with the new times
        // await ContentDetail.updateOne(
        //     { _id: contentDetail._id },
        //     {
        //         $set: {
        //             startTime: minStartTime,
        //             endTime: maxEndTime
        //         }
        //     }
        // );

        console.log(`ContentDetail updated with startTime: ${minStartTime} and endTime: ${maxEndTime}`);
    } else {
        console.log("ContentDetail not found.");
    }
}
