export default async function checkDuplicateBranch(name, BranchData) {
    console.log(name)
    // console.log(BranchData)
    const result = await BranchData.find({ name: name }).toArray();
    console.log(result.length)
    if (result.length > 0) {
        return false
    } else if (result.length == 0) {
        return true
    }
}
