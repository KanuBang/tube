import Video from "../models/video";
import User from "../models/User";
/*
console.log("start")
Video.find({}, (error, videos) => {
  if(error){
    return res.render("server-error")
  }
  return res.render("home", { pageTitle: "Home", videos });
});
console.log("finished")
*/

export const home = async (req, res) => {
    console.log("start")
    const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
    return res.render("home", {pageTitle:"HOME", videos})
}

export const watch = async (req, res) => {
    const {id} = req.params;
    const video = await Video.findById(id).populate("owner")
    if(!video) {
      return res.render("404", {pageTitle: "NOT FOUND"})
    }

    //console.log(video)
    return res.render('watch', {pageTitle: video.title, video})   
}

export const getEdit = async (req, res) => {
  const {id} = req.params;
  
  const {user: {_id},
  } = req.session

  const video = await Video.findById(id);

  if(!video) {
    return res.status(404).render("404", {pageTitle: "NOT FOUND"})
  }

  if(String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/")
  }

  return res.render('edit', {pageTitle: `Edit: ${video.title}`, video})
}

export const postEdit = async (req, res ) => {
  const {
    user: { _id },
  } = req.session;
  const id = req.params.id;
  const {title, description, hashtags} = req.body;
  const video = await Video.findOne({owner:_id});
 
  if(!video) {
    return res.status(404).render("404", {pageTitle: "NOT FOUND"})
  }
  if(String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/")
  }

  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  })
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req,res) => {
  return res.render("upload", {pageTitle:"Upload Video"})
};

export const postUpload = async (req,res) => {
  const {path: fileUrl} = req.file
  const {
    user: {_id},
  } = req.session
  const {title, description, hashtags} = req.body

  try {
     const newVideo = await Video.create({
        title,
        description,
        fileUrl,
        //createdAt:"asdfsadf", // error발생  -> catch문으로 이동
        createdAt: Date.now(),
        hashtags: Video.formatHashtags(hashtags),
        owner: _id,
      })

      const user = await User.findById(_id)
      user.videos.push(newVideo._id)
      user.save()

      return res.redirect("/")
  } catch(error) {
    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message, 
    })
  }

}

export const deleteVideo = async (req, res) => {
  const {id} = req.params
  const {user:{_id},} = req.session
  const video = await Video.findById(_id)
  
  if(!video) {
    return res.status(404).render("404", {pageTitle: "Video Not Found"})
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id)
  return res.redirect('/')
}

export const search = async (req, res) => {
  const {keyword} = req.query
  let videos = [];
  if(keyword) {
      videos = await Video.find({
        title: {
          $regex: new RegExp(`${keyword}$`,"i"),
        },
      }).populate("owner");
  }

  return res.render("search", {pageTitle: "Search", videos})
}

export const registerView = async(req, res) => {
  const {id} = req.params;
  const video = await Video.findById(id)
  if(!video) {
    return res.sendStatus(404)
  }
  video.meta.views = video.meta.views+1;
  await video.save()
  return res.sendStatus(200);
} 