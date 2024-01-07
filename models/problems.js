import mongoose from "mongoose";

let problemSchema = new mongoose.Schema({
   title: { type: String, required: true, unique: true },
   description: { type: String, required: true },
   difficulty: { type: String, required: true },
   topics: [{ type: String }],
   examples: [{ type: Object }],
   limits: { type: String, required: true }
})

export default mongoose.models.Problems || mongoose.model("Problems", problemSchema, "Problems");