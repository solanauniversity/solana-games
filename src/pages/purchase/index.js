import React, { useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import Cards from 'react-credit-cards';
import {
  formatCreditCardNumber,
  formatCVC,
  formatExpirationDate,
  formatNumber,
} from './../../utils/cardUtils';
import '../../assets/css/styles-compiled.css';
import './index.css'
import LoadingOverlay from 'react-loading-overlay';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-confirm-alert/src/react-confirm-alert.css';
import 'react-circular-progressbar/dist/styles.css';
import { sleepUtil } from '../../utils/sleepUtil';
import { toast, ToastContainer } from 'react-toastify';
import { checkPaymentStatus, fetchPCIKeys, makePayment, requestSOLFromBackend } from '../../utils/paymentGateway';
import { PublicKey } from '@solana/web3.js';
const defaultCardValues = {
  number: '5545 2345 2342 2342',
  name: 'Solgamer ',
  expiry: '04/23',
  cvc: '454',
  issuer: '',
  focused: '',
  amount: '1',
  equivalentSOL: 1,
  formData: null,
};

function Purchase() {
  const history = useHistory();
  const [progress, setProgress] = useState(0);
  const [provider, setProvider] = useState(window.solana);
  const [cardState, setCardState] = useState({
    ...defaultCardValues,
  });
  const [initialText, setText] = useState(
    'Hold tight, we are deducting the required SOL tokens to play...'
  );

  const handleInputFocus = (e) => {
    setCardState({
      ...cardState,

      focus: e.target.name,
    });
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    let equivalentSOL = cardState.equivalentSOL;
    if (name === 'number') {
      value = formatCreditCardNumber(value);
    } else if (name === 'expiry') {
      value = formatExpirationDate(value);
    } else if (name === 'cvc') {
      value = formatCVC(value);
    } else if (name === 'amount') {
      value = formatNumber(value);
      equivalentSOL = parseFloat(value) * 100;
    }

    setCardState({
      ...cardState,
      equivalentSOL,
      [name]: value,
    });
  };

  const submitCardTransaction = async () => {
    let inte = setInterval(
      () => setProgress((prog) => Math.min(prog + 1, 99)),
      600
    );
    const pciKeys = await fetchPCIKeys();
    setText('Initiating the transaction...');
    const result = await makePayment({ ...cardState, ...pciKeys });
    setText('Checking the payment status...');
    await checkPaymentStatus(result.paymentData.id);
    setText(
      `Transaction successful, We are transferring your account with ${cardState.equivalentSOL
      } SOL tokens...`
    );
    await sleepUtil(2000);
    clearInterval(inte);

    await requestSOLFromBackend(cardState.equivalentSOL, new PublicKey(provider.publicKey).toBase58())

    setProgress(100);
    toast.success(
      `We have successfully transferred ${cardState.equivalentSOL
      } SOL tokens to your phantom wallet...`
    );
    await sleepUtil(3000);
    toast.info(`Taking you to the game menu...`);
    await sleepUtil(500);
    history.push(`/stack`);
    setCardState({ ...defaultCardValues });
  };

  return (
    <LoadingOverlay
      active={progress > 0 && progress < 100}
      spinner={
        <CircularProgressbar
          value={progress}
          text={`${progress}%`}
          styles={buildStyles({
            width: '300px',
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
            pathColor: `#03C221`,
            textColor: '#fff',
            trailColor: `#fff`,
            backgroundColor: '#3e98c7',
          })}
        />
      }
      text={initialText}
    >
      <div>
        <div
          style={{
            backgroundImage: 'url("./hero_bg.svg")',
            backgroundSize: 'auto 100vh',
            backgroundAttachment: 'fixed',
          }}
        >
          <div>
            <div className="headingDiv">
              <h1>
                Payment Gateway
              </h1>
              <span className="text-white">
                Note: Dummy details are prefilled. The below transaction can be
                done with random card details. Please DO NOT enter real card
                details.
              </span>
            </div>

            <br />
            <div class="w-full flex justify-center p-16 rounded-md bg-gray-900 bg-opacity-40 glowing-theme-blue mt-4 paymentDiv">
              <div class="w-1/2 mx-auto text-gray-400">
                <div class="mb-4">
                  <label class="font-bold text-md ml-1 ">Name on card</label>
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      required
                      value={cardState.name}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      class="w-full px-3 py-3 mt-2 bg-gray-800 mb-1 border-2 border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div class="mb-4">
                  <label class="font-bold text-md ml-1">Card number</label>
                  <div>
                    <input
                      type="tel"
                      name="number"
                      placeholder="Card Number"
                      value={cardState.number}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      class="w-full px-3 py-3 mt-2 bg-gray-800 mb-1 border-2 border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="0000 0000 0000 0000"
                      type="text"
                    />
                  </div>
                </div>
                <div class="mb-4 -mx-2 flex items-end">
                  <div class="px-2 w-1/2">
                    <label class="font-bold text-md ml-1">
                      Expiration date
                    </label>
                    <div>
                      <input
                        type="tel"
                        name="expiry"
                        placeholder="Valid Thru"
                        pattern="\d\d/\d\d"
                        required
                        value={cardState.expiry}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        class="w-full px-3 py-3 mt-2 bg-gray-800 mb-1 border-2 border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="04/21"
                        type="text"
                      />
                    </div>
                  </div>
                  <div class="mb-4 -mx-2 flex items-end">
                    <div class="px-2 w-1/2">
                      <label class="font-bold text-md ml-1">CVV</label>
                    </div>
                    <input
                      type="tel"
                      name="cvc"
                      placeholder="CVC"
                      pattern="\d{3,4}"
                      required
                      value={cardState.cvc}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      class="w-full px-3 py-3 mt-2  bg-gray-800 mb-1 border-2 border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="CVV"
                      type="text"
                    />
                  </div>
                </div>
                <div class="mb-4">
                  <label class="font-bold text-md ml-1">
                    Billing Address
                  </label>
                  <div>
                    <textarea
                      class="w-full px-3 py-2  bg-gray-800 h-48 mt-2 mb-1 border-2 border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Enter your Address"
                      type="text"
                    />
                  </div>
                </div>
                <div class="mb-8">
                  <label class="font-bold text-md ml-1">Phone number</label>
                  <div>
                    <input
                      class="w-full px-3 py-3 mt-2  bg-gray-800 mb-1 border-2 border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="+919998887771"
                      type="text"
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <div>
                    <input
                      type="text"
                      name="amount"
                      className="w-full px-4 py-3 my-2 rounded bg-gray-800 bg-opacity-80 text-white"
                      placeholder="Amount (USD)"
                      required
                      value={cardState.amount}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                    />
                    <label className="pt-2 text-gray-300 text-sm">
                      1 USD = 1 SOL
                    </label>
                  </div>
                </div>
                <div>
                  <button
                    class="payButton"
                    onClick={submitCardTransaction}
                  >
                    <i class="mdi mdi-lock-outline mr-1" /> PAY NOW
                  </button>
                </div>
              </div>

              <div class="w-1/2 mx-auto text-gray-700 pt-28">
                <Cards
                  cvc={cardState.cvc}
                  expiry={cardState.expiry}
                  focused={cardState.focus}
                  name={cardState.name}
                  number={cardState.number}
                />
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </LoadingOverlay>
  );
}
export default Purchase;
