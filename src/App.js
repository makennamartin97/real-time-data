import './App.css';
import React, { useState, useEffect, useRef} from 'react';
import { formatData} from "./utils";
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';

function App() {
  //all available cryptocurrencies we can select
  const [currencies, setCurrencies] = useState([]);
  //current pair of cryptocurrencies we are looking at
  const [pair, setpair] = useState("");

  //values to display
  //price
  const [price, setprice] = useState("0.00");
  //best ask
  const [bestask, setbestask] = useState("0.00");
  //best bid
  const [bestbid, setbestbid] = useState("0.00");


  //websocket reference to keep it consistent so it 
  //doesn't get recreated on everyv render
  const [pastData, setpastData] = useState({});
  const ws = useRef(null);

  let first = useRef(false);
  const url = "https://api.pro.coinbase.com";

  useEffect(() => {
    ws.current = new WebSocket("wss://ws-feed.pro.coinbase.com");
    //empty array for currency pairs
    let pairs = [];
    //asynchronous api call
    const apiCall = async () => {
      //using base url and fetch all of coinbases currency pairs, and assign
      //that to the currency array
      await fetch(url + "/products")
        .then((res) => res.json())
        .then((data) => (pairs = data));
      //filter the pairs
      let filtered = pairs.filter((pair) => {
        
        // if (pair.quote_currency === "USD" && pair.base_currency === "BTC" || pair.quote_currency === "USD" && pair.base_currency === "ETH" || pair.quote_currency === "USD" && pair.base_currency === "LTC" || pair.quote_currency === "USD" && pair.base_currency === "BCH") {
        //   return pair;
        // }
        return pair.quote_currency === "USD" && (pair.base_currency === "BTC" || pair.base_currency === "ETH" || pair.base_currency === "LTC" || pair.base_currency === "BCH")
          // if(pair.base_currency === "BTC" || pair.base_currency === "ETH" || pair.base_currency === "LTC" || pair.base_currency === "BCH" ){
          //   console.log('pair',pair)
          //   return pair
          // }
        //}
    

      });
      //sort it alphabetically
      let sorted = filtered.sort((a, b) => {
        if (a.base_currency < b.base_currency) {
          return -1;
        }
        if (a.base_currency > b.base_currency) {
          return 1;
        }
        return 0;
      });

      
      setCurrencies(sorted);
      

      first.current = true;
    };

    apiCall();
  }, []);

  useEffect(() => {
    if (!first.current) {
      
      return;
    }

    
    let msg = {
      type: "subscribe",
      product_ids: [pair],
      channels: ["ticker"]
    };
    let jsonMsg = JSON.stringify(msg);
    //ws.current.onopen = () => ws.current.send(jsonMsg);
    ws.current.send(jsonMsg);
    // ws.current.onopen = function (e) {
    //   ws.send(jsonMsg);
    // };
    
    //https://api.exchange.coinbase.com/products/{product_id}/book
    //let idk  = requests.get('https://api.pro.coinbase.com/products/ADA-USD/ticker').json()
    //let historicalDataURL = `${url}/products/${pair}/ticker`;
    let historicalDataURL = `${url}/products/${pair}/candles?granularity=86400`;
    console.log(historicalDataURL, 'historical data url')
    const fetchHistoricalData = async () => {
      let dataArr = [];
      await fetch(historicalDataURL)
        .then((res) => res.json())
        .then((data) => (dataArr = data));

      console.log('data arr before formatted', dataArr)
      
      let formattedData = formatData(dataArr);
      setpastData(formattedData);
    };

    fetchHistoricalData();

    ws.current.onmessage = (e) => {
      let data = JSON.parse(e.data);
      console.log('data', data)
      if (data.type !== "ticker") {
        return;
      }

      if (data.product_id === pair) {
        setprice(data.price);
        setbestask(data.best_ask)
        setbestbid(data.best_bid)
      }
    };
  }, [pair, bestask, bestbid]);

  const handleSelect = (e) => {
    let unsubMsg = {
      type: "unsubscribe",
      product_ids: [pair],
      channels: ["ticker"]
    };
    let unsub = JSON.stringify(unsubMsg);

    ws.current.send(unsub);

    setpair(e.target.value);
  };



  return (
    <div className="App">
      <Navbar/>
  
      <div className="container">
      {
        <select name="currency" value={pair} onChange={handleSelect} className="cselect">
            <option>Currency Pairs</option>
          {currencies.map((cur, idx) => {
            return (
              <option key={idx} value={cur.id}>
                {cur.display_name}
              </option>
            );
          })}
        </select>
      }
      </div>
      <div className="">
     
      <Dashboard data={pastData} pair={pair} price={price} bestask={bestask} bestbid={bestbid} />
      </div>

    </div>
  );
}

export default App;