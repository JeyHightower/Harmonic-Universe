import { useAppSelector } from "../../hooks/useSetterToolbox"
import { Spinner } from "../Universal/Spinner";



export const Characters = () => {

    const { allCharacters, isLoading, currentCharacter  } = useAppSelector((state) => state.character);
    const 

    if (isLoading) return <Spinner />;

    return (

        <main className = {styles.pageContainer}>
            <header>
                <h1>Your Characters</h1>
                <button onClick={() => }
            </header>
        </main>
    )
    
} 