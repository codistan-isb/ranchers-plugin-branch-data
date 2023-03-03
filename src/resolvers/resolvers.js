import ObjectID from "mongodb";
export default {
    Mutation: {
        createBranch: async (parent, { input }, context, info) => {
            console.log(input)
            const { BranchData } = context.collections;
            const result = await BranchData.insertOne(input);
            // console.log(result.insertedId)
            // console.log(result.ops[0])
            // console.log(result.ops[0].branchname)
            return result.ops[0];
        },
        async deleteBranch(parent, args, context, info) {
            const { BranchData } = context.collections;
            const { branchname } = args
            const branch = await BranchData.findOne({ branchname });

            if (!branch) {
                throw new Error(`Branch "${branchname}" not found`);
            }

            await BranchData.deleteOne({ _id: branch._id });
            console.log(BranchData)
            // Ensure that branchname is never null
            if (branch.branchname === null) {
                branch.branchname = '';
            }

            return branch;
        }

    },
    Query: {
        branches: async (parent, args, context, info) => {
            const { BranchData } = context.collections;
            const branches = await BranchData.find().toArray();
            console.log(branches)
            return branches
        },
        async getBranchByName(parent, args, context, info) {
            const { BranchData } = context.collections;
            const { branchname } = args
            const branch = await BranchData.findOne({ branchname });
            console.log(branch)
            // Ensure that branchname is never null
            if (branch && branch.branchname === null) {
                branch.branchname = '';
            }

            return branch;
        }
    },
}