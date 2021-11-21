/* eslint-disable jsx-a11y/heading-has-content */
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import "./styles.scss";
const StackIt = () => {
    const [time, setTime] = useState(0);
    var timing = React.useRef();
    const history = useHistory()

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.getElementById("lose-message").style.display !== "block") {
                setTime(time + 1);
                timing.current.innerText = time + 1;
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [time]);

    useEffect(() => {


        const objLoader = document.createElement("script");
        objLoader.src = "/lib/OBJLoader.js";
        objLoader.type = "text/javascript";
        objLoader.async = true;
        document.body.appendChild(objLoader);

        const mtlLoader = document.createElement("script");
        mtlLoader.src = "/lib/MTLLoader.js";
        mtlLoader.type = "text/javascript"
        mtlLoader.async = true;
        document.body.appendChild(mtlLoader);

        const stats = document.createElement("script");
        stats.src = "/lib/stats.js";
        stats.type = "text/javascript"
        stats.async = true;
        document.body.appendChild(stats);



        const scene = document.createElement("script");
        scene.src = "/stackScene.js";
        scene.async = true;
        document.body.appendChild(scene);
    }, []);
    const withdrawEarnings = () => {
        const score = document.getElementById("score").textContent;
        history.push(`/createNFT/${Number(score)}/${time}`)
        // alert(`Achieved ${Number(score)} points in ${time} seconds!`)

    }
    return (
        <div className="stackMain">
            <div id="warm" className="overlay"></div>
            <div id="Stats-output"></div>
            <div id="WebGL-output"></div>
            <div id="canvas-area"></div>
            <div id="lose-message">
                <h1>Game Over</h1>
                <div>
                    <h2 style={{ fontSize: "30px" }}>[Your Score]</h2>

                    <h2 id="score" style={{ fontSize: "30px" }}></h2>
                    <h2 style={{ fontSize: "30px" }}>[Max Combo]</h2>
                    <h2 id="maxCombo" style={{ fontSize: "30px" }}></h2>
                    <h2 style={{ fontSize: "30px" }}>[Time Spent]</h2>
                    <h2 style={{ fontSize: "30px" }} ref={timing}></h2>

                </div>
                <ul>

                    <button id="button-restart" onClick={() => setTime(0)}>restart</button>
                    <button onClick={withdrawEarnings}>Claim tokens</button>
                </ul>
                <p>- or press R to restart - </p>
            </div>

        </div>
    )
}
export default StackIt;