import express from "express";
import { graphqlHTTP } from "express-graphql";
import { GraphQLObjectType, GraphQLSchema, GraphQLNonNull, GraphQLList, GraphQLString, GraphQLInt } from "graphql";

import problemsModel from './models/problems.js';
import cors from "cors"
import mongoose from 'mongoose';

import dotenv from "dotenv";

dotenv.config({
   path: ".env.local"
})

let app = express();

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
      id: { type: new GraphQLNonNull(GraphQLString) },
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

const RootQuery = new GraphQLObjectType({
   name: "Query",
   description: "This is Root Query",
   fields: () => ({
      problem: {
         type: problemType,
         description: "problem",
         args: {
            id: { type: GraphQLString }
         },
         resolve: async (parent, args) => {
            try {
               const data = await problemsModel.findOne({
                  id: `${args.id}`
               });

               return data;
            } catch (error) {
               console.log("Unable to connect to the database in Problem service");
               console.log(error);
               return {};
            }
         }
      },

      problems: {
         type: new GraphQLList(problemType),
         description: "List of all the problems",
         args: {
            page: { type: GraphQLInt }
         },
         resolve: async (parent, args) => {
            try {
               const data = await problemsModel.find({}).skip(5 * (args.page - 1)).limit(5);
               return data;
            } catch (error) {
               console.log("Unable to connect to the database in Problem service");
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
               console.log("Unable to connect to the database in Problem service");
               console.log(error);
               return -1;
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
      console.log("Unable to connect to the database during service bootup.");
      console.log(error);
   }
}) 