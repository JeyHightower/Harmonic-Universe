import { useEffect } from 'react';
import axios from 'axios'; 



export default App;

//! Link to backend. to see if they can talk to eachother and they do. 
// function App() {
//   useEffect(() => {
//     axios.get('/api/data')
//     .then(res => console.log("System check:", res.data))
//     .catch(err => console.error("Rule Broken:", err))
//   }, [])

//   return (<h1> Rule-Engine-System Connected</h1>)
// }