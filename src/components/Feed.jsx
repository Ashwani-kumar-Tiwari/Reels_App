import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthProvider';
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
//import IconButton from '@material-ui//IconButton';
import Avatar from '@material-ui/core/Avatar';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';
import uuid from 'react-uuid'
import {database, storage} from '../firebase';
import FavoriteIcon from '@material-ui/icons/Favorite';

function Feed() {
    const useStyles = makeStyles((theme) => ({
        root: {
            '& > *': {
                margin: theme.spacing(1),
            },
        },
        input: {
            display: 'none',
        },
        icon: {
            color: "red",
            position: "absolute",
            // left: "38rem",
            bottom: "1vh",
            fontSize: "2rem"
        },
        heart: {
            left:"37rem"
        },
        chat: {
            left:"40rem"
        },
        notSelected: {
            color : "lightgray"
        },
        selected: {
            color: "red"
        }
    }));

    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState();
    const [pageLoading, setPageLoading] = useState(true);
    const { signout, currentUser } = useContext(AuthContext)
    const [videos, setVideos] = useState([]);
    const [isLiked, setLiked] = useState(false);
    // const [reel, setReel] =useState();
    const handleLogout = async () => {
        try {
            setLoading(true);
            // auth provider s
            await signout();
            setLoading(false);
        } catch (err) {
            console.log(err);
            setLoading(false)
        }
    }
    const handleInputFile = (e) => {
        e.preventDefault();
        let file = e?.target?.files[0];
        if (file != null) {
            console.log(e.target.files[0])
        }

        if(file.size /(1024 *1024) < 20){
            alert("The slected file is very big");
            return;
        }
        //1. upload
        const uploadTask = storage.ref(`/posts/${uuid()}`).put(file);
        setLoading(true);
        //progress
        const f1 = snapshot => {
            const progress = snapshot.bytesTransferred / snapshot.totalBytes;
            console.log(progress);
            //this call back is for providing the progress
        }
        //error
        const f2 = () => {
            alert("There was an error in uploading the file");
            return;
        }
        //success
        const f3 = () => {
            uploadTask.snapshot.ref.getDownloadURL().then(async url => {
                //2. post collection -> post documnet put
                let obj = {
                    comments : [],
                    likes: [],
                    url,
                    auid: currentUser.uid,
                    createdAt: database.getUserTimeStamp()
                }

                //put the postObj into the post collection
                let postObj = await database.posts.add(obj);

                //3. user PostId -> new post id put
                await database.users.doc(currentUser.uid).update({
                    postIds:[...user.postIds, postObj.id]
                })
                console.log(postObj);
                setLoading(false);
            })
        }
        uploadTask.on('state_changed', f1, f2, f3);
    }

    const handleLiked = async (puid) => {
        let postRef = await database.posts.doc(puid).get();
        let post = postRef.data();
        let likes = post.likes;
        if(isLiked == false) {
            database.posts.doc(puid).update ({
                "likes" : [...likes, currentUser.uid]
            })
        } else {
            let likes = post.likes.filter(lkuid  => {
                return lkuid != currentUser.uid;
            })
            database.posts.doc(puid).update ({
                "likes" : likes
            })
        }
        setLiked(!isLiked)
    }

    //component did mount
    //user data get
    useEffect(async() => {
        console.log(currentUser.uid);
        database.users.doc(currentUser.uid).onSnapshot((snapshot) => {
            console.log(snapshot.data());
            setUser(snapshot.data());
            setPageLoading(false);
        });
    },[]);

    //get post video
    useEffect(async() => {
        let unsub = await database.posts.orderBy("createdAt", "desc").onSnapshot(async snapshot => {
            //console.log(snapshot.docs[0].data());
            //console.log(snapshot.docs.map(doc => doc.data().url));

            let videos = snapshot.docs.map(doc => doc.data());
            // let videosUrls = videos.map(video => video.url);
            // let auidArr = videos.map(video => video.auid);
            // let userArr = [];

            // for(let i = 0; i < auidArr.length; i++){
            //     let userObject = await database.users.doc(auid[i].get());
            //     userArr.push(userObject);
            // }

            let videosArr = [];
            for(let i = 0; i < videos.length; i++){
                let videoUrl = videos[i].url;
                let auid = videos[i].auid;
                let id = snapshot.docs[i].id;
                let userObject = await database.users.doc(auid).get();
                let userProfileUrl = userObject.profileUrl;
                let userName = userObject.userName;
                videosArr.push({videoUrl, userProfileUrl, userName, puid:id});
            }
            setVideos(videosArr);
        })

        return unsub;
    }, []);

    return (
        pageLoading == true ? <div>Loading.....</div> : <div>
            <div className="navbar">
            <Avatar alt="Remy Sharp" src={user.profileUrl} />
            <button onClick={handleLogout} disabled={loading}>Logout</button>
            </div>
            <div className="uploadImage">
                <div className = {classes.root}>
                    <input accept="file" className ={classes.input} id ="icon-button-file" type="file" 
                    onChange = {handleInputFile}/>
                    <label htmlFor="icon-button-file">
                       <Button variant="contained" color ="primary" component ="span" disabled ={loading} endIcon={<PhotoCamera/>}>Upload</Button>
                    </label>
                </div>
            </div>
            <div className="feed">
                {videos.map((videoObj, idx) =>{
                   return <div className="video-container">
                        <Video
                            src = {videoObj.videoUrl}
                            id = {videoObj.puid}
                            userName={videoObj.userName}
                        ></Video>
                        <FavoriteIcon className = {[classes.icon, classes.heart, isLiked == false ? classes.notSelected : classes.selected]}
                        onClick = {() => {handleLiked(videoObj.puid)}}></FavoriteIcon>
                        <ChatBubbleIcon className = {[classes.icon, classes.chat, classes.notSelected]} onClick ={() => {
                            alert("open popup")
                        }}>

                        </ChatBubbleIcon>
                        {/* hidden -> overlay - comments view */}
                    </div>
                })}
            </div>
        </div>
    )
}

function Video(props) {
    //console.log(props.userName);
    return (
        <>
            <video style ={{
            height: "86vh",
            marginBottom: "5rem",
            marginTop: "2rem",
            border: '1px solid red'
        }} autoPlay muted="true" id={props.id} >
                <source src={
                    props.src
                } type="video/mp4"

                >
                </source>
            </video >
            {props.userName}
        </>
    )
}

export default Feed