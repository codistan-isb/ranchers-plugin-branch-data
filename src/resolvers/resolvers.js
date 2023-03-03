import ObjectID from "mongodb";
export default {
    Mutation: {
        createBranch: async (parent, { input }, context, info) => {
            const { BranchData } = context.collections;
            const result = await BranchData.insertOne(input);
            console.log(result)
            const newBranch = await BranchData.findOne({ _id: ObjectID(result.insertedId) });
            console.log(newBranch)
            return newBranch;
        },
    },

}