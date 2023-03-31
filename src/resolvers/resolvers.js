import ObjectID from "mongodb";
import checkDuplicateBranch from "../utils/checkDuplicateBranch.js";
export default {
    Mutation: {
        async createBranch(parent, { input }, context, info) {
            // console.log(context.user);
            // console.log(input)
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            // console.log(input)
            const { BranchData } = context.collections;
            // console.log(BranchData)
            const { name } = input;
            const isDuplicate = await checkDuplicateBranch(name, BranchData);
            console.log(isDuplicate)
            if (isDuplicate == false) {
                throw new Error("A branch with the same name already exists", {
                    invalidArgs: "Branch Name",
                });
            }
            const newBranch = {
                ...input,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await BranchData.insertOne(newBranch);
            return result.ops[0];
        },
        async deleteBranch(parent, args, context, info) {
            console.log(context.user);
            console.log(args)
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            const { name } = args
            const branch = await BranchData.findOne({ name });
            console.log(branch)
            if (!branch) {
                throw new Error(`Branch "${name}" not found`);
            }

            await BranchData.deleteOne({ _id: branch._id });
            console.log(BranchData)
            // Ensure that branchname is never null
            if (branch.name === null) {
                branch.name = '';
            }

            return branch;
        },
        async updateBranchData(parent, { name, input }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            // const { branchname, input } = args
            const branch = await BranchData.findOne({ name });

            if (!branch) {
                throw new Error(`Branch ${name} not found`);
            }

            const updatedBranch = {
                ...branch,
                ...input
            };

            const UpdatedBranchDataResp = await BranchData.updateOne({ _id: branch._id }, { $set: updatedBranch });
            console.log(UpdatedBranchDataResp)
            // Ensure that branchname is never null
            if (updatedBranch.name === null) {
                updatedBranch.name = '';
            }

            return updatedBranch;
        },
    },
    Query: {
        branches: async (parent, args, context, info) => {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            const branches = await BranchData.find().sort({ createdAt: 1 }).toArray();
            console.log(branches)
            const cleanedBranches = branches.map(branch => ({
                ...branch,
                name: branch.name ?? null,
            }));
            return cleanedBranches
        },
        async getBranchByName(parent, args, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { BranchData } = context.collections;
            const { name } = args
            const branch = await BranchData.findOne({ name });
            console.log(branch)
            // Handle null values for the _id field
            if (!branch) {
                throw new Error(`Branch '${name}' not found`);
            }
            branch._id = branch._id.toString();
            return branch;
        },
        async getRiderCount(parent, args, context, info) {
            console.log(context.user);
            console.log(args);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { name } = args;
            const { users } = context.collections;
            const bracnhRegex = new RegExp(`^${name}$`, 'i');
            const roleRegex = new RegExp('^rider$', 'i');
            // const db = dataSources.usersAPI.db;
            console.log(roleRegex)
            const usersDetail = await users.find({ name: bracnhRegex, userRole: { $regex: roleRegex } }).toArray();
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
            const { City } = args;
            const branches = await BranchData.find({ City: City }).toArray();
            console.log(branches)
            return branches.map(branch => ({
                _id: branch._id,
                name: branch.name,
                address: branch.address,
                phoneNumber1: branch.phoneNumber1,
                phoneNumber2: branch.phoneNumber2,
                phoneNumber3: branch.phoneNumber3,
                Latitude: branch.Latitude,
                Longitude: branch.Longitude,
                City: branch.City,
                Description: branch.Description,
                createdAt: branch.createdAt instanceof Date ? branch.createdAt.toISOString() : null,
                updatedAt: branch.updatedAt instanceof Date ? branch.updatedAt.toISOString() : null,
                Sector: branch.Sector,
                Timing: branch.Timing,
                deliveryArea: branch.deliveryArea,
            }));

        }
    },
}