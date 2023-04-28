import ObjectID from "mongodb";
import checkDuplicateBranch from "../utils/checkDuplicateBranch.js";
import ReactionError from "@reactioncommerce/reaction-error";
export default {
    Branch: {
        async taxInfo(parent, args, context, info) {
            // console.log("parent", parent);
            // console.log(parent.taxID);
            if (parent.taxID) {
                const { TaxRate } = context.collections;
                const taxDataResponse = await TaxRate.find({
                    _id: ObjectID.ObjectId(parent.taxID),
                }).toArray();
                // console.log("Tax Data : ", taxDataResponse[0]);
                return taxDataResponse[0];
            } else {
                return [];
            }
        },
    },
    Mutation: {
        async createBranch(parent, { input }, context, info) {
            // console.log(context.user);
            // console.log(input)
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please login first");
            }
            // console.log(input)
            const { BranchData } = context.collections;
            // console.log(BranchData)
            const { name } = input;
            const isDuplicate = await checkDuplicateBranch(name, BranchData);
            // console.log(isDuplicate);
            if (isDuplicate == false) {
                throw new ReactionError(
                    "conflict",
                    "A branch with the same name already exists"
                );
                // throw new ReactionError("A branch with the same name already exists", "Branch Name");
            }
            // console.log(new Date().toISOString());
            const newBranch = {
                ...input,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await BranchData.insertOne(newBranch);
            return result.ops[0];
        },
        async deleteBranch(parent, args, context, info) {
            // console.log(context.user);
            // console.log(args);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please login first");
            }
            const { BranchData } = context.collections;
            const { _id } = args;
            const branch = await BranchData.findOneAndDelete({
                _id: new ObjectID.ObjectId(_id),
            });

            // const branch = await BranchData.findOne({ name });
            // console.log("branch", branch);
            if (!branch) {
                throw new ReactionError("not-found", `Branch "${_id} " not found`);
            }

            // await BranchData.deleteOne({ _id: branch._id });
            // console.log(BranchData)
            // // Ensure that branchname is never null
            if (branch.name === null) {
                branch.name = "";
            }

            return true;
        },
        async updateBranchData(parent, { _id, input }, context, info) {
            // console.log(context.user);
            // console.log(_id);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please login first");
            }
            const { BranchData } = context.collections;
            // const { branchname, input } = args
            const branch = await BranchData.findOne({
                _id: new ObjectID.ObjectId(_id),
            });
            // console.log("Branch Data:- ", branch);
            if (!branch) {
                throw new ReactionError("not-found", `Branch "${_id}" not found`);
            }

            const updatedBranch = {
                ...branch,
                ...input,
                updatedAt: new Date().toISOString(),
            };
            // console.log("updated Branch Data: ", updatedBranch);
            const UpdatedBranchDataResp = await BranchData.updateOne(
                { _id: branch._id },
                { $set: updatedBranch }
            );
            // console.log(UpdatedBranchDataResp);
            // Ensure that branchname is never null
            if (updatedBranch.name === null) {
                updatedBranch.name = "";
            }

            return updatedBranch;
        },
        async createTax(parent, args, context, info) {
            // console.log("create Tax");
            // console.log("args:- ", args.input);
            // console.log(context.user);
            // console.log(_id)
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please login first");
            }
            // console.log("Context:- ", context.collections);
            const createTaxInput = {
                ...args.input,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            // console.log(createTaxInput);
            const { TaxRate } = context.collections;
            // console.log("Tax Rate ", TaxRate);
            const createTaxResponse = await TaxRate.insertOne(createTaxInput);
            // console.log("Create Tax Response :- ", createTaxResponse);
            return createTaxResponse.ops[0];
        },
        async updateTax(parent, { _id, Label, Region, Cash, Card }, context, info) {
            const now = new Date();

            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please login first");
            }
            const filter = { _id: ObjectID.ObjectId(_id) };
            const update = {};
            update.updatedAt = now;
            if (Label) {
                update.Label = Label;
            }
            if (Region) {
                update.Region = Region;
            }
            if (Cash) {
                update.Cash = Cash;
            }
            if (Card) {
                update.Card = Card;
            }
            // console.log(update);
            // console.log("id:-", filter);
            const { TaxRate } = context.collections;
            const options = { new: true };
            const updateTaxResponse = await TaxRate.findOneAndUpdate(
                filter,
                { $set: update },
                options
            );
            // console.log("Update resp:- ", updateTaxResponse);
            if (updateTaxResponse.value) {
                return updateTaxResponse.value;
            } else {
                return null;
            }
        },
        async deleteTax(parent, _id, context, info) {
            // console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please login first");
            }
            // console.log(_id._id);
            // const Tax_id = _id._id;
            // console.log(Tax_id);
            const { BranchData, TaxRate } = context.collections;
            // const branchLinkedWithTax = await BranchData.find({ taxID: { $exists: true } }).toArray();
            const branchLinkedWithTax = await BranchData.find({
                taxID: { $eq: Tax_id },
            }).toArray();

            // const branchLinkedWithTax = await BranchData.find({ taxID: Tax_id }).toArray();
            // console.log(" All data resp:- ", branchLinkedWithTax.length);
            if (branchLinkedWithTax.length > 0) {
                throw new ReactionError(
                    "conflict",
                    "Tax ID is already linked with branch, to delete the tax first unlink the branch "
                );
            }
            else {
                const TaxRateDeleteResp = await TaxRate.findOneAndDelete({ _id: new ObjectID.ObjectId(_id._id) });
                // console.log("TaxRateDeleteResp:- ", TaxRateDeleteResp);
                if (TaxRateDeleteResp.value !== null || TaxRateDeleteResp.value !== undefined) {
                    throw new ReactionError("not-found", "Tax region not found");
                }
                else {
                    return true;
                }

            }

        },
    },
    Query: {
        branches: async (parent, args, context, info) => {
            // console.log(context.user);
            // console.log(new Date().toISOString());
            // if (context.user === undefined || context.user === null) {
            //     throw new Error("Unauthorized access. Please login first");
            // }
            const { BranchData } = context.collections;
            const branches = await BranchData.find()
                .sort({ createdAt: -1 })
                .toArray();
            // console.log(branches);
            const cleanedBranches = branches.map((branch) => ({
                ...branch,
                name: branch.name ?? null,
            }));
            // console.log(cleanedBranches);
            return cleanedBranches;
        },
        async getBranchByName(parent, args, context, info) {
            // console.log(context.user);
            // if (context.user === undefined || context.user === null) {
            //     throw new Error("Unauthorized access. Please login first");
            // }
            const { BranchData } = context.collections;
            const { name } = args;
            const branch = await BranchData.findOne({ name }).sort({ createdAt: -1 });
            // console.log(branch);
            // Handle null values for the _id field
            if (!branch) {
                throw new ReactionError(`Branch "${name}" not found`);
            }
            branch._id = branch._id.toString();
            return branch;
        },
        async getRiderCount(parent, args, context, info) {
            // console.log(context.user);
            // console.log(args);
            // if (context.user === undefined || context.user === null) {
            //     throw new Error("Unauthorized access. Please login first");
            // }
            const { name } = args;
            const { users } = context.collections;
            const bracnhRegex = new RegExp(`^${name}$`, "i");
            const roleRegex = new RegExp("^rider$", "i");
            // const db = dataSources.usersAPI.db;
            // console.log(roleRegex);
            const usersDetail = await users
                .find({ name: bracnhRegex, userRole: { $regex: roleRegex } })
                .sort({ createdAt: -1 })
                .toArray();
            // console.log(usersDetail);
            return usersDetail.length;
        },
        async getBranchByCityName(parent, args, context, info) {
            // console.log(context.user);
            // console.log(args);
            // if (context.user === undefined || context.user === null) {
            //     throw new Error("Unauthorized access. Please login first");
            // }
            const { BranchData } = context.collections;
            const { City } = args;
            const branches = await BranchData.find({ City: City })
                .sort({ createdAt: -1 })
                .toArray();
            // console.log(branches);
            return branches.map((branch) => ({
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
                createdAt:
                    branch.createdAt instanceof Date
                        ? branch.createdAt.toISOString()
                        : null,
                updatedAt:
                    branch.updatedAt instanceof Date
                        ? branch.updatedAt.toISOString()
                        : null,
                Sector: branch.Sector,
                Timing: branch.Timing,
                deliveryArea: branch.deliveryArea,
            }));
        },
        async getAlltaxData(parent, args, context, info) {
            // console.log(context.user);
            const { TaxRate } = context.collections;
            const getalltaxRateDataResp = await TaxRate.find().toArray();
            // console.log(getalltaxRateDataResp)
            return getalltaxRateDataResp
        },
    },
};
