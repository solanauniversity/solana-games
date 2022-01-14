import axios from 'axios';
import * as openpgp from 'openpgp'
import { v4 as uuidv4 } from 'uuid';
/**
  * CircleAPI implementation
  * @returns 
  */
export const circleAPIBase = 'https://api-sandbox.circle.com'
export const backendBase = process.env.REACT_APP_BASE_APP
export const circleAPIAuthToken = process.env.REACT_APP_CIRCLE_API_AUTH_KEY
export const fetchPCIKeys = async () => {
  try {

    /**
     * API call to fetch the encryption key based on the token provided
     */
    let config = {
      headers: {
        'Content-Type': 'application/json;charset=utf8',
        'Authorization': `Bearer ${circleAPIAuthToken}`
      }
    };
    const result = await axios.get(`${circleAPIBase}/v1/encryption/public`, config)
    const encryptionPublicKey = result.data.data.publicKey
    const keyId = result.data.data.keyId
    return {
      encryptionPublicKey,
      keyId,
      status: true
    }

  } catch (err) {
    return {
      status: true,
      error: err
    }
  }

}

export const makePayment = async (paymentParams) => {
  try {

    const keyId = paymentParams.keyId
    const publicKey = paymentParams.encryptionPublicKey
    const amount = paymentParams.amount
    const key = {
      keyId,
      publicKey
    }


    const exampleCards = [
      {
        title: '4007400000000007 (visa)',
        formData: {
          cardNumber: '4007400000000007',
          cvv: '123',
          expiry: {
            month: '01',
            year: '2025',
          },
          name: 'Customer 0001',
          country: 'US',
          district: 'MA',
          line1: 'Test',
          line2: '',
          city: 'Test City',
          postalCode: '11111',
          phoneNumber: '+12025550180',
          email: 'customer-0001@circle.com',
        },
      }
    ]

    const tempDetails = {
      number: exampleCards[0].formData.cardNumber.trim().replace(/\D/g, ''),
      cvv: exampleCards[0].formData.cvv
    }

    if (!publicKey || !keyId) {
      throw new Error('Unable to encrypt data')
    }
    //atob
    const decodedPublicKey = Buffer.from(publicKey, 'base64').toString('binary')
    const options = {
      message: await openpgp.message.fromText(JSON.stringify(tempDetails)),
      publicKeys: (await openpgp.key.readArmored(decodedPublicKey)).keys,
    }

    const ciphertext = await openpgp.encrypt(options)
    //btoa
    const encryptedMessage = Buffer.from(ciphertext.data).toString('base64')
    /**
   * API call to save the card details
   */
    const cardDetails = {
      "idempotencyKey": `${uuidv4()}`,
      "expMonth": 1, "expYear": 2025, "keyId": `${keyId}`,
      "encryptedData": `${encryptedMessage}`, "billingDetails": { "line1": "Test", "line2": "", "city": "Test City", "district": "MA", "postalCode": "11111", "country": "US", "name": "Customer 0001" },
      "metadata": { "phoneNumber": "+12025550180", "email": "customer-0001@circle.com", "sessionId": "xxx", "ipAddress": "172.33.222.1" }
    }

    let config = {
      headers: {
        'Content-Type': 'application/json;charset=utf8',
        'Authorization': `Bearer ${circleAPIAuthToken}`
      }
    };
    let cardResult = await axios.post(`${circleAPIBase}/v1/cards`, cardDetails, config)

    /**
     * sample returned response
     */
    //  cardResult = {"data":{
    //    "id":"bdf3e5d0-ef69-4864-9f6f-b6e254b4f7d8", //important key, as this key will be used in the payment API to make the payment
    //    "status":"pending","last4":"0007","billingDetails":{"name":"Customer 0001","line1":"Test","city":"Test City","postalCode":"11111","district":"MA","country":"US"},"expMonth":1,"expYear":2025,"network":"VISA","bin":"400740","issuerCountry":"ES","fundingType":"debit","fingerprint":"603b2185-1901-4eae-9b98-cc20c32d0709","verification":{"cvv":"pending","avs":"pending"},"createDate":"2021-09-26T22:35:19.195Z","metadata":{"phoneNumber":"+12025550180","email":"customer-0001@circle.com"},"updateDate":"2021-09-26T22:35:19.195Z"}}


    const cardReturnedKey = cardResult.data.data.id
    /** 
     * API call to make the payment with the card details
     */

    const paymentCardDetails = {
      "idempotencyKey": `${uuidv4()}`,
      "amount": { "amount": `${amount}`, "currency": "USD" },
      "verification": "cvv", "source": {
        "id": cardReturnedKey,
        "type": "card"
      },
      "description": "", "channel": "",
      "metadata": {
        "phoneNumber": "+12025550180", "email": "customer-0001@circle.com", "sessionId": "xxx", "ipAddress": "172.33.222.1"
      },
      "encryptedData": `${encryptedMessage}`,
      "keyId": keyId
    }

    config = {
      headers: {
        'Content-Type': 'application/json;charset=utf8',
        'Authorization': `Bearer ${circleAPIAuthToken}`
      }
    };
    let paymentResult = await axios.post(`${circleAPIBase}/v1/payments`, paymentCardDetails, config)


    /**
     * Dummy payment response
     */
    // paymentResult = {
    //   "data":{
    //     "id":"40f3d404-2d34-492b-af80-c29ae5e90588", //paymentId of the transaction, we can query the status of the payment based on this key
    //     "type":"payment",
    //     "merchantId":"c147a9bc-8c20-4665-9430-6612a099ed29",
    //     "merchantWalletId":"1000176251",
    //     "source":{"id":"bdf3e5d0-ef69-4864-9f6f-b6e254b4f7d8","type":"card"},
    //     "description":"Merchant Payment","amount":{"amount":"5.00","currency":"USD"},
    //     "status":"pending",
    //     "refunds":[],
    //     "createDate":"2021-09-26T22:35:20.655Z","updateDate":"2021-09-26T22:35:20.655Z","metadata":{"phoneNumber":"+12025550180","email":"customer-0001@circle.com"}}}


    // const paymentId = paymentResult.data.data.id
    return { status: true, paymentData: paymentResult.data.data }

  }
  catch (err) {
    return {
      status: false,
      error: err
    }
  }
}


/**
 * CircleAPI checkPaymentStatus
 */

export const checkPaymentStatus = async (paymentId) => {
  try {

    if (!paymentId) {
      throw Error("Payment Id is required to fetch the payment status")
    }
    /**
     * API call to check 
     */

    const config = {
      headers: {
        'Content-Type': 'application/json;charset=utf8',
        'Authorization': `Bearer ${circleAPIAuthToken}`
      }
    };
    let paymentStatusResult = await axios.get(`${circleAPIBase}/v1/payments/${paymentId}`, config)
    /**
     * Dummy payment status 
     */
    // paymentStatusResult = {
    //    "data":{
    //      "id":"40f3d404-2d34-492b-af80-c29ae5e90588","type":"payment","merchantId":"c147a9bc-8c20-4665-9430-6612a099ed29","merchantWalletId":"1000176251","source":{"id":"bdf3e5d0-ef69-4864-9f6f-b6e254b4f7d8","type":"card"},
    //      "description":"Merchant Payment","amount":{"amount":"5.00","currency":"USD"},
    //      "fees":{"amount":"0.45","currency":"USD"},
    //      "status":"confirmed","verification":{"cvv":"pass","avs":"Y"},"refunds":[],"createDate":"2021-09-26T22:35:20.655Z","updateDate":"2021-09-26T22:35:21.393420Z","metadata":{"phoneNumber":"+12025550180","email":"customer-0001@circle.com"}}}


    if (paymentStatusResult.data.data.status === "confirmed") {

      return {
        status: true
      }

    }
    return {
      status: false
    }
  } catch (err) {
    return {
      status: false,
      error: err
    }
  }
}

export const requestSOLFromBackend = async (solAmount, selfPublicKey) => {
  try {

    /**
     * API call to fetch the encryption key based on the token provided
     */
    let config = {
      headers: {
        'Content-Type': 'application/json;charset=utf8'
      }
    };
    const result = await axios.post(`${backendBase}/transferToken`, {
      solAmount,
      toPublicKey: selfPublicKey
    }, config)
    if (!result.status) {
      return {
        status: false,
        message: "Please check the sender account balance, if it has SOL balance to transfer."
      }
    }

    return {
      status: true,
      message: "Successfully Transferred the amount."
    }

  } catch (err) {
    return {
      status: false,
      error: err
    }
  }
}