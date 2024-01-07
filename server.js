import express from "express";
import { graphqlHTTP } from "express-graphql";
import { GraphQLObjectType, GraphQLSchema, GraphQLNonNull, GraphQLList, GraphQLString, GraphQLInt } from "graphql";

import submissionsModel from './models/submissions.js';
import problemsModel from './models/problems.js';
import cors from "cors"
import mongoose from 'mongoose';

import dotenv from "dotenv";

dotenv.config({
   path: ".env.local"
})

let app = express();

const submissionPageSize = 10;
const problemPageSize = 5;

const PORT = process.env.PORT || 3003;

const exampleType = new GraphQLObjectType({
   name: "Example",
   description: "A example test case",
   fields: () => ({
      input: { type: new GraphQLNonNull(GraphQLString) },
      output: { type: new GraphQLNonNull(GraphQLString) }
   })
})

const problemType = new GraphQLObjectType({
   name: "Problem",
   description: "Problem",
   fields: () => ({
      title: { type: new GraphQLNonNull(GraphQLString) },
      description: { type: new GraphQLNonNull(GraphQLString) },
      difficulty: { type: new GraphQLNonNull(GraphQLString) },
      limits: { type: new GraphQLNonNull(GraphQLString) },
      topics: {
         type: new GraphQLList(GraphQLString),
         resolve: (problem) => problem.topics
      },

      examples: {
         type: new GraphQLList(exampleType),
         resolve: (problem) => problem.examples
      }
   })
})

const submissionType = new GraphQLObjectType({
   name: "Submission",
   description: "A submission",
   fields: () => ({
      submissionId: { type: GraphQLInt },
      user: { type: GraphQLString },
      problemTitle: { type: GraphQLString },
      code: { type: GraphQLString },
      status: { type: GraphQLString },
      time: { type: GraphQLString }
   })
})

const RootQuery = new GraphQLObjectType({
   name: "Query",
   description: "This is Root Query",
   fields: () => ({
      problem: {
         type: problemType,
         description: "problem",
         args: {
            title: { type: GraphQLString }
         },
         resolve: async (parent, args) => {
            try {
               const data = await problemsModel.findOne({
                  title: `${args.title}`
               });

               return data;
            } catch (error) {
               console.log("Unable to connect to the database in Data service");
               console.log(error);
               return {};
            }
         }
      },

      problems: {
         type: new GraphQLList(problemType),
         description: "List of all the problems in a page",
         args: {
            page: { type: GraphQLInt }
         },
         resolve: async (parent, args) => {
            try {
               // const data = await problemsModel.find({}).skip(problemPageSize * (args.page - 1)).limit(problemPageSize);

               const data = await problemsModel.aggregate([
                  {
                     $skip: problemPageSize * (args.page - 1)
                  },

                  {
                     $limit: problemPageSize
                  }
               ])
               return data;
            } catch (error) {
               console.log("Unable to connect to the database in Data service");
               console.log(error);
               return {};
            }
         }
      },

      problemCount: {
         type: GraphQLInt,
         description: "count of problems available in database",
         resolve: async () => {
            try {
               const count = await problemsModel.find({}).countDocuments();
               return count;
            } catch (error) {
               console.log("Unable to connect to the database in Data service");
               console.log(error);
               return -1;
            }
         }
      },

      submissions: {
         type: GraphQLList(submissionType),
         description: "List of submissions in a page",
         args: {
            page: { type: GraphQLInt },
            user: { type: GraphQLString },
            problemTitle: { type: GraphQLString }
         },
         resolve: async (parent, args) => {
            try {
               const data = await submissionsModel.aggregate([
                  {
                     $match: {
                        user: args.user,
                        problemTitle: args.problemTitle
                     }
                  },

                  {
                     $sort: {
                        submissionId: -1
                     }
                  },

                  {
                     $skip: submissionPageSize * (args.page - 1),
                  },

                  {
                     $limit: submissionPageSize
                  }
               ]);

               return data;
            } catch (error) {
               console.log("Unable to connect to the database in Data service");
               console.log(error);
               return {};
            }
         }
      },

      submission: {
         type: submissionType,
         description: "submission",
         args: {
            submissionId: { type: GraphQLInt }
         },
         resolve: async (parent, args) => {
            try {
               const data = await submissionsModel.findOne({
                  submissionId: `${args.submissionId}`
               });

               return data;
            } catch (error) {
               console.log("Unable to connect to the database in Data service");
               console.log(error);
               return {};
            }
         }
      },

      submissionCount: {
         type: GraphQLInt,
         description: "Count of all the submissions of a user",
         args: {
            user: { type: GraphQLString }
         },
         resolve: async (parent, args) => {
            try {
               const count = await submissionsModel.findOne({ user: args.user }).countDocuments();
               return count;
            } catch (error) {
               console.log("Unable to connect to the database in Data service");
               console.log(error);
               return {};
            }
         }
      }
   })
})

const schema = new GraphQLSchema({
   query: RootQuery
})

app.use(cors());

app.use("/graphql", graphqlHTTP({
   schema: schema,
   graphiql: true,
}))

app.listen(PORT, async () => {
   try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`rce-data service running on port ${PORT}`)
   } catch (error) {
      console.log("Unable to connect to the database during Data service bootup.");
      console.log(error);
   }
}) 