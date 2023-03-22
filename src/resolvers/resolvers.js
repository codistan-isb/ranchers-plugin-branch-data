import ObjectID from "mongodb";
export default {
    Mutation: {
        async createBranch(parent, { input }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            console.log(input)
            const { BranchData } = context.collections;
            const result = await BranchData.insertOne(input);
            // console.log(result.insertedId)
            // console.log(result.ops[0])
            // console.log(result.ops[0].branchname)
            return result.ops[0];
        },
        async deleteBranch(parent, args, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
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
        },

        async updateBranchData(parent, { branchname, input }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            // const { branchname, input } = args
            const branch = await BranchData.findOne({ branchname });

            if (!branch) {
                throw new Error(`Branch "${branchname}" not found`);
            }

            const updatedBranch = {
                ...branch,
                ...input
            };

            const UpdatedBranchDataResp = await BranchData.updateOne({ _id: branch._id }, { $set: updatedBranch });
            console.log(UpdatedBranchDataResp)
            // Ensure that branchname is never null
            if (updatedBranch.branchname === null) {
                updatedBranch.branchname = '';
            }

            return updatedBranch;
        }


    },
    Query: {
        branches: async (parent, args, context, info) => {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            const branches = await BranchData.find().toArray();
            console.log(branches)
            return branches
        },
        async getBranchByName(parent, args, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            const { branchname } = args
            const branch = await BranchData.findOne({ branchname });
            console.log(branch)
            // Ensure that branchname is never null
            if (branch && branch.branchname === null) {
                branch.branchname = '';
            }

            return branch;
        },
        async getRiderCount(parent, args, context, info) {
            console.log(context.user);
            console.log(args);

            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { branchname } = args;
            const { users } = context.collections;
            const bracnhRegex = new RegExp(`^${branchname}$`, 'i');
            const roleRegex = new RegExp('^rider$', 'i');
            // const db = dataSources.usersAPI.db;
            console.log(roleRegex)
            const usersDetail = await users.find({ branchname: bracnhRegex, userRole: { $regex: roleRegex } }).toArray();
            console.log(usersDetail)
            return usersDetail.length;
        },
        async getBranchByCityName(parent, args, context, info) {
            console.log(context.user);
            console.log(args)
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            const { branchCity } = args;
            const branches = await BranchData.find({ branchCity: branchCity.toLowerCase() }).toArray();
            console.log(branches)
            return branches.map(branch => ({
                _id: branch._id,
                branchname: branch.branchname,
                branchaddress: branch.branchaddress,
                branchphonenumber: branch.branchphonenumber,
                branchLat: branch.branchLat,
                branchLong: branch.branchLong,
                branchCity: branch.branchCity,
                branchDescription: branch.branchDescription,
                createdAt: branch.createdAt ? branch.createdAt.toISOString() : null,
                updatedAt: branch.updatedAt ? branch.updatedAt.toISOString() : null,
                branchSector: branch.branchSector,
                branchTiming: branch.branchTiming,
            }));

        }

    },
}