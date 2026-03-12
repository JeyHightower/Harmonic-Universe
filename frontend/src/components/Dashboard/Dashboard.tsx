import { useDashboardData } from "../../hooks/useDashboardData";
import { Spinner } from "../Universal/Spinner";


const Dashboard = () => {
    const { data:uiData, updateField, isLoading } = useDashboardData();

    if (isLoading) return  <Spinner />


    return (
        <div className="dashboard">
            <h1> Welcome, {uiData?.username || 'Guest'}!</h1>
            <p> Current Status: {uiData?.accountStatus}</p>
            
            <button onClick={() => updateField('accountStatus', 'Active')}>
            Set To Active
        </button>
        </div>

    )
}

export default Dashboard;