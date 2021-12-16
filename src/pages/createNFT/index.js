import React, { useState } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import LoadingOverlay from 'react-loading-overlay';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import domToImage from 'dom-to-image';
import {
  connectOrGetPhantomProvider,
  Creator,
  dataURLtoFile,
  mintNFT,
} from '../../utils/nftCreation';
import { connection } from '../../utils/walletUtils';
import { PublicKey } from '@solana/web3.js';
import bg from '../../assets/images/bg-2.jpg';
import './index.css'
function GenerateNFT() {
  const [playerName, setPlayerName] = useState('');
  const [progress, setProgress] = useState(0);

  const history = useHistory()

  let { score, timeSpent } = useParams();
  const [provider, setProvider] = useState(window.solana);

  let tokensSOLGEarned = Math.ceil(timeSpent / 30); 
  const changePlayerName = (e) => {
    setPlayerName(e.target.value);
  };

  let inte;
  const convertDOMtoBase64 = async () => {
    const node = document.getElementById('gameNFT');
    return domToImage.toPng(node);
  };

  const mintNFTHandler = async () => {
    console.log('mintNFTHandler got called');

    if (!provider || (provider && !provider.isConnected)) {
      setProvider(connectOrGetPhantomProvider(true));
      return;
    }

    const img = await convertDOMtoBase64();
    const templateImage = dataURLtoFile(img, 'GameTemplate.png');
    const ownerPublicKey = new PublicKey(provider.publicKey).toBase58();
    const selfCreator = new Creator({
      address: ownerPublicKey,
      verified: true,
      share: 100,
    });
    const metadata = {
      name: `TEST_NFT`,
      symbol: 'MNFT',
      creators: [selfCreator],
      description: '',
      sellerFeeBasisPoints: 0,
      image: templateImage.name,
      animation_url: '',
      external_url: '',
      properties: {
        files: [templateImage],
        category: 'image',
      },
    };

    inte = setInterval(
      () => setProgress((prog) => Math.min(prog + 1, 99)),
      600
    );
    // Update progress inside mintNFT
    try {
      await mintNFT(
        connection,
        provider,
        {},
        [templateImage],
        metadata,
        1000000000
      );

      clearInterval(inte);
      setProgress(0);
      alert("NFT created successfully")
      history.push('/')
    } catch (e) {
      clearInterval(inte);
      setProgress(0);
    }
  };
  return (
    <LoadingOverlay
      active={progress}
      spinner={
        <CircularProgressbar
          value={progress}
          text={`${progress}%`}
          styles={buildStyles({
            // Rotation of path and trail, in number of turns (0-1)
            // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'

            strokeLinecap: 'butt',
            // Text size

            textSize: '16px',
            // How long animation takes to go from one percentage to another, in seconds

            pathTransitionDuration: 0.5,
            // Can specify path transition in more detail, or remove it entirely
            // pathTransition: 'none',

            // Colors
            pathColor: `#d21414`,
            textColor: '#fff',
            trailColor: `#fff`,
            backgroundColor: '#3e98c7',
          })}
        />
      }
      text="Hold tight, NFT creation is in progress..."
    >
      <section
        className="wrapperDiv"
        style={{
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
         <header className="header">
          <Link to="/"> <h2 className="gameHeader">STACK GAME</h2> </Link>
          <Link></Link>
        </header>
          <section className="" style={{'width': '500px', textAlign:"center"}}>
            <div className="w-1/2 py-16 pb-16">
              <div className="">
                <div className="lg:w-2/2 w-full lg:px-8 lg:py-20 mb-6 lg:mb-0 bg-gray-900 bg-opacity-50 px-16 rounded-xl">
                  <h1 className="text-white text-left text-3xl font-medium font-medium mb-2">
                    Your NFT details!
                  </h1>
                  <div className="flex mb-4">
                    <a className="flex-grow text-white border-b-2 border-indigo-800 text-md px-1"></a>
                  </div>

                  <form className="w-full max-w-xl">
                    <div className="w-100 py-2">
                      <label
                        className="block font-bold text-lg text-white mb-2"
                        for="grid-password"
                      >
                        Enter your name : &nbsp;
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={playerName}
                        onChange={changePlayerName}
                        style={{height:"30px"}}
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <br />

            <div className="w-1/2 px-10 py-10" id="gameNFT" >
              <div
                className="relative h-full rounded-lg text-center border-4 border-white flex justify-around flex-col py-7 nftImage"
                style={{
                  'background-image': `url(${bg})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '0px 0px',
                  'backgroundSize': '500px 358px',
                  overflow:"hidden",
                }}
              >
                <div className="absolute w-full h-full opacity-80 bg-gray-900 z-0"></div>
                    <h1 className="text-white font-extrabold text-2xl" style={{    marginTop: '-55px', color:"white"}}>
                      Solgames NFT
                    </h1>
                <div className="relative z-10 score-Wrapper">
                  <h1 className="text-white text-2xl font-normal nftTextWrapper">
                    <div style={{textAlign:"right"}} className="nftLeftText" className="nftLeftText" style={{color:"white"}}>
                    Played by:
                    </div>
                    <div className="text-purple-300 font-bold rightText">
                      {playerName}{' '}
                    </div>
                  </h1>
                  <h1 className="text-white text-2xl font-normal nftTextWrapper">
                  <div style={{textAlign:"right"}} className="nftLeftText" style={{color:"white"}}>
                    Game score:{' '}
                    </div>
                    <div className="text-purple-300 font-bold rightText">{score}</div>
                  </h1>
                  <h1 className="text-white text-2xl font-normal nftTextWrapper">
                  <div style={{textAlign:"right"}} className="nftLeftText" style={{color:"white"}}>
                    Gameplay duration:{' '}
                    </div>
                    <div className="text-purple-300 font-bold rightText">
                      {timeSpent} secs
                    </div>
                  </h1>
                  <h1 className="text-white text-xl font-normal nftTextWrapper">
                  <div style={{textAlign:"right"}} className="nftLeftText" style={{color:"white"}}>
                    Game played on:{' '}
                    </div>
                    <div className="text-purple-300 font-bold rightText">
                      {new Date().toDateString()}
                    </div>
                  </h1>
                  <h1 className="text-white text-xl font-normal nftTextWrapper">
                  <div style={{textAlign:"right"}} className="nftLeftText" style={{color:"white"}}>
                    Tokens earned:{' '}
                    </div>
                    <div className="text-purple-300 font-bold rightText">
                      {tokensSOLGEarned} SOLG
                    </div>{' '}
                    
                  </h1>
                </div>
              </div>
            </div>
            <button
                      type="button"
                      className="loginButton"
                      onClick={mintNFTHandler}
                      style={{width:"320px"}}
                    >
                      &nbsp; Create your NFT
                    </button>
          </section>
      </section>
    </LoadingOverlay>
  );
}
export default GenerateNFT;
