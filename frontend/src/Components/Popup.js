import React from "react";
import { MutatingDots } from "react-loader-spinner";

const Parent = ({ children, ...rest }) => {
  return (
    <div
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10"
      id="popup"
    >
      <div class="bg-white rounded-lg p-6">{children}</div>
    </div>
  );
};

const Loader = () => {
  return (
    <div className="flex items-center justify-center">
      <MutatingDots
        height="100"
        width="100"
        color="#ed8936"
        secondaryColor="#ed8936"
        radius="12.5"
        ariaLabel="mutating-dots-loading"
        visible={true}
      />
    </div>
  );
};

const Header = ({ title }) => {
  return <h2 class="text-lg font-medium mb-4">{title}</h2>;
};

const Popup1 = () => {
  return (
    <Parent isLoder={true}>
      <Header>Recording Completed!</Header>
      <p class="mb-4">
        Uploading and Transcoding using{" "}
        <span className="font-bold" style={{ color: "RGB(4,217,255)" }}>
          Theta Video API
        </span>
        <Loader />
      </p>
    </Parent>
  );
};

const Popup2 = () => {
  return (
    <Parent isLoder={false}>
      <Header>Miniting Video NFT!</Header>
      <p class="mb-4">Confirm transaction to Mint Video NFT on Theta.</p>
      <Loader />
    </Parent>
  );
};

const Popup3 = (props) => {
  const { txHash, videoId } = props.data.txData
  return (
    <Parent isLoder={false}>
      <Header>Video NFT Minted!</Header>
      <p class="mb-4">
        Tx Hash: <a className="border-b-2" href={`https://testnet-explorer.thetatoken.org/txs/${txHash}`}>{txHash}</a>
      </p>
      <div className="flex flex-col items-center justify-center ">
        <span className="font-bold">Play Video</span>
        <button onClick={()=>{
            window.open(`https://player.thetavideoapi.com/video/${videoId}`)
        }} className="flex items-center justify-center bg-gray-100 hover:bg-gray-200  rounded-full p-2 ">
          <svg
            className="w-6 h-6 text-gray-500 hover:text-gray-600 transition-all duration-75 ease-in-out"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </Parent>
  );
};

export default ({ ptype, ...rest }) => {
  return (
    <>
      {ptype == "p1" && <Popup1  />}
      {ptype == "p2" && <Popup2 />}
      {ptype == "p3" && <Popup3 data={rest} />}
    </>
  );
};
