import {
    Connection
  } from "@solana/web3.js";
import { NETWORK } from "./nftCreation";

export const connection = new Connection(NETWORK);