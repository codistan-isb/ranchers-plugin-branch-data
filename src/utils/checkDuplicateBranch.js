export default async function checkDuplicateBranch(name, BranchData) {
    const result = await BranchData.find({ name: name }).toArray();
    if (result.length > 0) {
        return false
    } else if (result.length == 0) {
        return true
    }
}
