import ObjectID from "mongodb";
import checkDuplicateBranch from "../utils/checkDuplicateBranch.js";
import ReactionError from "@reactioncommerce/reaction-error";
import getPaginatedResponse from "@reactioncommerce/api-utils/graphql/getPaginatedResponse.js";
import wasFieldRequested from "@reactioncommerce/api-utils/graphql/wasFieldRequested.js";
import checkIfTime from "../utils/checkIfTime.js";
export default {
  Branch: {
    async taxInfo(parent, args, context, info) {
      try {
        if (parent.taxID) {
          const { TaxRate } = context.collections;
          const taxDataResponse = await TaxRate.find({
            _id: ObjectID.ObjectId(parent.taxID),
          }).toArray();
          return taxDataResponse[0];
        } else {
          return [];
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
  },
  Mutation: {
    async createBranch(parent, { input }, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
      }
      try {
        const { BranchData } = context.collections;
        const { name } = input;
        const isDuplicate = await checkDuplicateBranch(name, BranchData);
        if (isDuplicate == false) {
          throw new ReactionError(
            "conflict",
            "A branch with the same name already exists"
          );
        }
        const newBranch = {
          ...input,
          isDeleted: false,
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const result = await BranchData.insertOne(newBranch);
        return result.ops[0];
      } catch (error) {
        console.log("error", error);
      }
    },
    async deleteBranch(parent, args, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
      }
      try {
        const { BranchData } = context.collections;
        const { _id } = args;
        const branch = await BranchData.findOneAndUpdate(
          {
            _id: new ObjectID.ObjectId(_id),
          },
          { $set: { isDeleted: true } },
          { new: true }
        );
        if (!branch) {
          throw new ReactionError("not-found", `Branch "${_id} " not found`);
        }
        if (branch.name === null) {
          branch.name = "";
        }

        return true;
      } catch (error) {
        console.log("error", error);
      }
    },
    async updateBranchData(parent, { _id, input }, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
      }
      try {
        const { BranchData } = context.collections;
        const branch = await BranchData.findOne({
          _id: new ObjectID.ObjectId(_id),
        });
        if (!branch) {
          throw new ReactionError("not-found", `Branch "${_id}" not found`);
        }
        const updatedBranch = {
          ...branch,
          ...input,
          updatedAt: new Date().toISOString(),
        };
        const UpdatedBranchDataResp = await BranchData.updateOne(
          { _id: branch._id },
          { $set: updatedBranch }
        );
        if (updatedBranch.name === null) {
          updatedBranch.name = "";
        }
        return updatedBranch;
      } catch (error) {
        console.log("error", error);
      }
    },
    async createTax(parent, args, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
      }
      try {
        const createTaxInput = {
          ...args.input,
          isDeleted: false,
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const { TaxRate } = context.collections;
        const createTaxResponse = await TaxRate.insertOne(createTaxInput);
        return createTaxResponse.ops[0];
      } catch (error) {
        console.log("error", error);
      }
    },
    async updateTax(parent, { _id, Label, Region, Cash, Card }, context, info) {
      const now = new Date();
      if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
      }
      try {
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
        const { TaxRate } = context.collections;
        const options = { new: true };
        const updateTaxResponse = await TaxRate.findOneAndUpdate(
          filter,
          { $set: update },
          options
        );
        if (updateTaxResponse.value) {
          return updateTaxResponse.value;
        } else {
          return null;
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    async deleteTax(parent, { _id }, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
      }
      try {
        const { BranchData, TaxRate } = context.collections;
        const branchLinkedWithTax = await BranchData.find({
          taxID: { $eq: _id },
        }).toArray();
        if (branchLinkedWithTax.length > 0) {
          throw new ReactionError(
            "conflict",
            "Tax ID is already linked with branch, to delete the tax first unlink the branch "
          );
        } else {
          const TaxRateDeleteResp = await TaxRate.findOneAndUpdate(
            {
              _id: new ObjectID.ObjectId(_id),
            },
            { $set: { isDeleted: true } },
            { new: true }
          );
          if (TaxRateDeleteResp) {
            return true;
          } else {
            throw new ReactionError("not-found", "Tax region not found");
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    },
  },
  Query: {
    branchesPagination: async (parent, args, context, info) => {
      try {
        let { collections } = context;
        const { BranchData } = collections;
        const { ...connectionArgs } = args;
        const branches = await BranchData.find({});
        // console.log(
        //   "await BranchData.find({ isDeleted: false })",
        //   await BranchData.find({}).toArray()
        // );
        return getPaginatedResponse(branches, connectionArgs, {
          includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
          includeHasPreviousPage: wasFieldRequested(
            "pageInfo.hasPreviousPage",
            info
          ),
          includeTotalCount: wasFieldRequested("totalCount", info),
        });
        // const branches = await BranchData.find()
        //   .sort({ createdAt: -1 })
        //   .toArray();
        // const cleanedBranches = branches.map((branch) => ({
        //   ...branch,
        //   name: branch.name ?? null,
        // }));
        // return cleanedBranches;
      } catch (error) {
        console.log("error", error);
      }
    },
    branches: async (parent, args, context, info) => {
      try {
        let { collections } = context;
        const { BranchData } = collections;
        const { ...connectionArgs } = args;
    
        // console.log("current branch time");
    
        const branches = await BranchData.find({})
          .sort({ createdAt: -1 })
          .toArray();
          // console.log("branches ",branches)
    
        const processedBranches = await Promise.all(
          branches.map(async (branch) => {
            if (branch.Timing) {
              const [startTime, endTime] = branch.Timing.split(" - ").map((time) => time.trim());
    
              // console.log("Processing branch:", branch.name);
              // console.log("Start Time:", startTime);
              // console.log("End Time:", endTime);
    
              // Call the checkIfTime function
              const isOpen = await checkIfTime(startTime, endTime);
    
              // console.log("Is branch open?", isOpen, "branch.name ", branch.name);
    
              return {
                ...branch,
                isOpen,
              };
            } else {
              console.warn("Timing field is missing for branch:", branch.name);
              return {
                ...branch,
                isOpen: false,
              };
            }
          })
        );
    
        // Filter out branches where isOpen is false
        // const filteredBranches = processedBranches.filter((branch) => branch.isOpen==true);
    
        // console.log("filteredBranches ", filteredBranches);
    
        return processedBranches;
      } catch (error) {
        console.log("error", error);
      }
    },    
    async getBranchByName(parent, args, context, info) {
      try {
        const { BranchData } = context.collections;
        const { name } = args;
        const branch = await BranchData.findOne({ name }).sort({
          createdAt: -1,
        });
        // Handle null values for the _id field
        if (!branch) {
          throw new ReactionError(`Branch "${name}" not found`);
        }
        branch._id = branch._id.toString();
        return branch;
      } catch (error) {
        console.log("error", error);
      }
    },
    async getRiderCount(parent, args, context, info) {
      try {
        const { name } = args;
        const { users } = context.collections;
        const bracnhRegex = new RegExp(`^${name}$`, "i");
        const roleRegex = new RegExp("^rider$", "i");
        const usersDetail = await users
          .find({ name: bracnhRegex, userRole: { $regex: roleRegex } })
          .sort({ createdAt: -1 })
          .toArray();
        return usersDetail.length;
      } catch (error) {
        console.log("error", error);
      }
    },
    async getBranchByCityName(parent, args, context, info) {
      try {
        const { BranchData } = context.collections;
        const { City } = args;
        const branches = await BranchData.find({ City: City })
          .sort({ createdAt: -1 })
          .toArray();
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
          displayName: branch.displayName,
        }));
      } catch (error) {
        console.log("error", error);
      }
    },
    async getAllTaxData(parent, args, context, info) {
      try {
        let { collections } = context;
        const { TaxRate } = collections;
        const { ...connectionArgs } = args;
        // isDeleted: false
        const getAllTaxRateDataResp = await TaxRate.find({});
        return getPaginatedResponse(getAllTaxRateDataResp, connectionArgs, {
          includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
          includeHasPreviousPage: wasFieldRequested(
            "pageInfo.hasPreviousPage",
            info
          ),
          includeTotalCount: wasFieldRequested("totalCount", info),
        });
        // return getalltaxRateDataResp;
      } catch (error) {
        console.log("error", error);
      }
    },
    async getAlltaxData(parent, args, context, info) {
      try {
        let { collections } = context;
        const { TaxRate } = collections;
        const { ...connectionArgs } = args;
        // isDeleted: false,
        const getAllTaxRateDataResp = await TaxRate.find({}).toArray();
        return getAllTaxRateDataResp;
      } catch (error) {
        console.log("error", error);
      }
    },
    async getRiderOrderReportStat(parent, { input }, context, info) {
      // console.log("input ", input);
      const { RiderOrder } = context.collections;
      if (
        context.user === undefined ||
        context.user === null ||
        context.user === ""
      ) {
        throw new ReactionError("access-denied", "Please login first");
      }
      if (context.user.userRole === "rider") {
        throw new ReactionError("access-denied", "Unauthorized user");
      }
      try {
        var matchStage = {};

        if (input) {
          var { branchId, endDate, startDate } = input;
          matchStage = {
            $match: {
              branches: branchId,
            },
          };
          if (startDate) {
            matchStage.$match.createdAt = {
              $gte: new Date(startDate),
              $lte: endDate ? new Date(endDate) : new Date(),
            };
          }
        } else {
          throw new ReactionError(
            "invalid-argument",
            "At least one field is required"
          );
        }
        // console.log("match stage: ", matchStage);
        let dataResp = await RiderOrder.aggregate([
          matchStage,
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              deliveredOrders: {
                $sum: {
                  $cond: [{ $eq: ["$OrderStatus", "delivered"] }, 1, 0],
                },
              },
              rejectedOrder: {
                $sum: {
                  $cond: [{ $eq: ["$OrderStatus", "canceled"] }, 1, 0],
                },
              },
              inProgressOrder: {
                $sum: {
                  $cond: [{ $eq: ["$OrderStatus", "pickedUp"] }, 1, 0],
                },
              },
            },
          },
        ]).toArray();
        // console.log("dataResp", dataResp);
        if (dataResp) {
          return dataResp[0];
        } else {
          return null;
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    async getOrderReportStat(parent, { input }, context, info) {
      try {
        const { Orders } = context.collections;

        if (
          context.user === undefined ||
          context.user === null ||
          context.user === ""
        ) {
          throw new ReactionError("access-denied", "Please login first");
        }
        if (context.user.userRole === "rider") {
          throw new ReactionError("access-denied", "Unauthorized user");
        }
        var matchStage = {};
        if (input) {
          var { branchId, endDate, startDate } = input;
          matchStage = {
            $match: {
              branchID: branchId,
            },
          };
          if (startDate || endDate) {
            if (!matchStage.$match) {
              matchStage.$match = {};
            }

            if (startDate && !endDate) {
              matchStage.$match.updatedAt = {
                $gte: new Date(startDate),
                $lte: new Date(startDate),
              };
            } else if (!startDate && endDate) {
              matchStage.$match.updatedAt = {
                $gte: new Date(endDate),
                $lte: new Date(endDate),
              };
            } else {
              matchStage.$match.updatedAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              };
            }
          }
        } else {
          throw new ReactionError(
            "invalid-argument",
            "At least one field is required"
          );
        }
        const orderStatResp = await Orders.aggregate([
          matchStage,
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              deliveredOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "delivered"] }, 1, 0],
                },
              },
              canceledOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "canceled"] }, 1, 0],
                },
              },
              inProcessOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "processing"] }, 1, 0],
                },
              },
              inReadyOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "ready"] }, 1, 0],
                },
              },
              inQueueOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "new"] }, 1, 0],
                },
              },
              rejectedOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "reject"] }, 1, 0],
                },
              },
              pickedUpOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "pickedUp"] }, 1, 0],
                },
              },
              confirmedOrders: {
                $sum: {
                  $cond: [{ $eq: ["$workflow.status", "confirmed"] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalOrders: 1,
              deliveredOrders: 1,
              canceledOrders: 1,
              rejectedOrders: 1,
              inQueueOrders: 1,
              inReadyOrders: 1,
              inProcessOrders: 1,
              pickedUpOrders: 1,
              confirmedOrders: 1,
            },
          },
        ]).toArray();
        console.log("orderStatResp ", orderStatResp);
        if (orderStatResp[0]) {
          return orderStatResp[0];
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    async getOrderStatusReport(parent, { input }, context, info) {
      try {
        const { Orders } = context.collections;
        if (
          context.user === undefined ||
          context.user === null ||
          context.user === ""
        ) {
          throw new ReactionError("access-denied", "Please login first");
        }
        if (context.user.userRole === "rider") {
          throw new ReactionError("access-denied", "Unauthorized user");
        }
        if (input) {
          var { branchId, endDate, startDate, status } = input;
          const filter = {
            branchID: branchId,
            "workflow.status": status,
          };
          if (startDate || endDate) {
            if (!filter.updatedAt) {
              filter.updatedAt = {};
            }
            if (startDate && !endDate) {
              filter.updatedAt.$gte = new Date(startDate);
              filter.updatedAt.$lte = new Date(startDate);
            } else if (!startDate && endDate) {
              filter.updatedAt.$gte = new Date(endDate);
              filter.updatedAt.$lte = new Date(endDate);
            } else {
              filter.updatedAt.$gte = new Date(startDate);
              filter.updatedAt.$lte = new Date(endDate);
            }
          }
          const count = await Orders.countDocuments(filter);
          if (count) {
            return {
              totalOrders: count,
            };
          } else {
            return {
              totalOrders: 0,
            };
          }
        } else {
          throw new ReactionError(
            "invalid-argument",
            "At least one field is required"
          );
        }
      } catch (error) {
        console.log("error", error);
      }
    },
  },
};
