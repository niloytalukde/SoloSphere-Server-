const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt =require('jsonwebtoken')
const cookieParser =require('cookie-parser')

const port = process.env.PORT || 9000;
const app = express();

app.use(cors(
  {
    origin:['http://localhost:5173'],
    credentials:true
  }
));
app.use(express.json());
 app.use(cookieParser())
const uri =
  "mongodb+srv://soloSphere:epsJdirl0wGoHJp9@cluster0.njtaw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//  veryfied Token 
const veryfied=async(req,res,next)=>{
const token =cookies?.token
if(!token)return res.send(401).message('UnAuthorize')
  jwt.verify(token,'secret',(err,decode)=>{
if(err){
  return res(401).send({message:UnValied})
}
req.user=decode
  })
}
async function run() {
  try {
    const db = client.db("Solo-db");
    const JobCollection = db.collection("jobs");
    const bidsCollection = db.collection("bids");
// genarate jwt token 

app.post('/jwt', async(req,res)=>{
const email=req.body
// create Token 
const token =jwt.sign(email,'secret',{expiresIn:'5h'})
res.cookie('token',token,{
 httpOnly:true,
 secure:false 
}).send({success:true})
})

// Clear cookie form browser
app.get('/logout',async(req,res)=>{
  res.clearCookie('token',{
    secure:false ,
    maxAge:0
  }).send({Logout:True})
})




    // Create a data in db
    app.post("/add-job", async (req, res) => {
      const data = req.body;
      const result = await JobCollection.insertOne(data);
      res.send(result);
    });

    // Read/Get  AllData and convert data in a array
    app.get("/jobs", async (req, res) => {
      const data = await JobCollection.find().toArray();
      res.send(data);
    });

    // get all data by user email
    app.get("/job/:email", async (req, res) => {
      const email = req.params.email;
      const quary = { "buyer.email": email };
      const result = await JobCollection.find(quary).toArray();
      res.send(result);
    });
    // delete job From db
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const result = await JobCollection.deleteOne(quary);
      res.send(result);
    });

    //Get  Single data
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;

      const quary = { _id: new ObjectId(id) };
      const result = await JobCollection.findOne(quary);
      res.send(result);
    });

    // Update job Data
    app.post("/update-job/:id", async (req, res) => {
      const jobData = req.body;
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const update = {
        $set: jobData,
      };
      const option = { upsert: true };

      const result = await JobCollection.updateOne(quary, update, option);
      res.send(result);
    });

    // Added Bids data in data collection
    app.post("/add-bid", async (req, res) => {
      const data = req.body;
      // 0.Check if this user are bid in this job
      // const quary = { email: bidData.email, jobId: bidData.jobId };
      // const alreadyExist = bidsCollection.findOne(quary);
      // if (alreadyExist)
      //   return res.status(400).send("You Already Bids This job!!");

      // 1.Save data  in db
      const result = await bidsCollection.insertOne(data);
      // incrise bid count
      const filter = { _id: new ObjectId(data.jobId) };
      const update = {
        $inc: { bid_count: 1 },
      };
      const option = { upsert: true };
      const updateBidCount = await JobCollection.updateOne(filter, update);
      // incrise bid count end
      res.send(result);
    });
    //  Find the user bid data use user email
    app.get("/my-bids/:email", async (req, res) => {
      const email = req.params.email;
      const isBuyer = req.query.buyer;
      let query = {};
      if (isBuyer) {
        query.buyer = email;
      } else {
        query.email = email;
      }

      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });
    //  Update bids request

    app.patch("/bid-status-update/:id", async (req, res) => {
      const status = req.body.update;
      console.log(status);
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: { status: status },
      };
      const result = bidsCollection.updateOne(filter, update);
      res.send(result);
    });

    // Filter and asc and dsc oder sort

    app.get("/all-jobs", async (req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      const sort = req.query.sort;
      let query = {
        job_title: {
          $regex: search,
          $options: "i",
        },
      };
      if (filter) {
        query.category = filter;
      }
      let options = {};
      if (sort)
        options = {
          sort: {
            deadline: sort === "asc" ? 1 : -1,
          },
        };

      const result = await JobCollection.find(query, options).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from SoloSphere Server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));

// soloSphere
// epsJdirl0wGoHJp9
