import React, {useEffect} from 'react'
import v1 from "./Video1.mp4"
import v2 from "./Video2.mp4"
import v3 from "./Video3.mp4"
import v4 from "./Video4.mp4"
import v5 from "./Video5.mp4"
import "./inter.css"

function IntersectionDemo() {

    function callBack(entries) {
        //console.log(entries);
        entries.forEach((entry) => {
            let child = entry.target.children[0];
            //console.log(child.id);
            // play -> async work
            // pause -> sync work
            child.play().then(function() {
                if(entry.isIntersecting == false){
                    child.pause();
                } 
                // else{
                //     console.log(child.id);
                // }
            })
        })
    }

    useEffect(function fn() {
        let conditionObject = {
            root : null,
            threshold : "0.9"
        }

        let observer = new IntersectionObserver(callBack, conditionObject);
        let elements = document.querySelectorAll(".Video-container");
        elements.forEach((e1) => {
            observer.observe(e1);
        })
    }, [])

    return (
        <div>
            <div className="Video-container">
                <Video
                    src = {v1}
                    id = "a"
                ></Video>
            </div>
            <div className="Video-container">
                <Video
                    src = {v2}
                    id = "b"
                ></Video>
            </div>
            <div className="Video-container">
                <Video
                    src = {v3}
                    id = "c"
                ></Video>
            </div>
            <div className="Video-container">
                <Video
                    src = {v4}
                    id = "d"
                ></Video>
            </div>
            <div className="Video-container">
                <Video
                    src = {v5}
                    id = "e"
                ></Video>
            </div>
        </div>
    )
}

export default IntersectionDemo

function Video(props) {

    return (
        <video className = "video-styles" controls muted = {true} id = {props.id}>
            <source src = {
                props.src
            } type = "video/mp4"            
            >
            </source>
        </video>
    )
}

