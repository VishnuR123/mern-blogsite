const express=require('express');
const cors=require('cors');
const mongoose=require("mongoose");
const User=require('./models/User');
const Post=require('./models/Post');
const bcrypt = require('bcryptjs');
const app=express();
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const path = require('path');
const fs=require('fs');
const multer=require('multer');
const uploadMiddleware = multer({ dest: path.join(__dirname, 'uploads/')});

const salt=bcrypt.genSaltSync(10);
const secret='alksdalskdnasd';//secret key for jwt to ensure integrity

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'uploads')));


mongoose.connect(MONGO_URI);


app.post('/register',async(req,res)=>{
    const {username,password}=req.body;
    try{
        const userDoc=await User.create({
            username,
            password:bcrypt.hashSync(password,salt),
        });
        res.json(userDoc);
    }catch(e){
        console.log(e);
        res.status(400).json(e);
    }
});

app.post('/login',async(req,res)=>{
    const {username,password} = req.body;
    const userDoc=await User.findOne({username});
    const passOk=bcrypt.compareSync(password, userDoc.password);
    if(passOk){
        jwt.sign({username,id:userDoc._id},secret, {}, (err,token)=>{
            if(err) throw err;
            res.cookie('token',token).json({
                id:userDoc._id,
                username, 
            });
        });
    }else{
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile',(req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
        if(err) throw err;
        res.json(info);
    });
});

app.post('/logout',(req,res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file') , async (req,res)=>{
    const {originalname,path,filename} =req.file;
    const parts=originalname.split('.');
    const ext=parts[parts.length - 1];
    const newPath=path+'.'+ext;
    fs.renameSync(path,newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if(err) throw err;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author: info.id,
        });
        res.json(postDoc);
    });
});  
 
app.put('/post',uploadMiddleware.single('file'), async (req,res) => {
    let newPath = null;
    if (req.file) {
      const {originalname,path} = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path+'.'+ext;
      fs.renameSync(path, newPath);
    }
  
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {id,title,summary,content} = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json('you are not the author');
      }
      const updatedPost = await Post.updateOne({_id:id},{
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });
  
      res.json(updatedPost);
    });
  
  });

app.delete('/post/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        // Find the post by ID and delete it
        const deletedPost = await Post.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' , idd:postId});
        }

        // Respond with a success message or other appropriate response
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        // Handle any errors that occur during the deletion process
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/post', async (req,res) => {
    res.json(
        await Post.find()
        .populate('author',['username'])
        .sort({createdAt:-1})
        .limit(20)
    );
});

app.get('/post/:id', async (req,res) => {
    const {id}= req.params;
    const postDoc =await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
});


app.listen(4000);



 
