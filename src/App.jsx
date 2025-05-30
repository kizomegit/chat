import './App.css'
import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { config } from './firebase-config.js'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection } from 'react-firebase-hooks/firestore'

const firebaseConfig = config

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

function App() {
    const [user] = useAuthState(auth)

    return (
        <div className='flex flex-col items-center justify-center' >
            <header> 
                <SignOut />
            </header>
            <section>
                {user ? <ChatRoom user={user} /> : <SignIn />}
            </section>
        </div>
    )
}

function SignIn() {
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider()
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result)
                const token = credential.accessToken
                const user = result.user
            })
            .catch((error) => {
                const errorCode = error.code
                const errorMessage = error.message
                const email = error.customData.email
                const credential = GoogleAuthProvider.credentialFromError(error)
            })
    }

    const signInWithGithub = () => {
        const provider = new GithubAuthProvider()
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GithubAuthProvider.credentialFromResult(result)
                const token = credential.accessToken
                const user = result.user
            })
            .catch((error) => {
                const errorCode = error.code
                const errorMessage = error.message
                const email = error.customData.email
                const credential = GithubAuthProvider.credentialFromError(error)
            })
    }

    return(
        <div className="flex flex-col items-center gap-4 mt-10">
            <button className="btn btn-primary w-64" onClick={signInWithGoogle}>
                Sign in with Google
            </button>
            <button className="btn btn-neutral w-64" onClick={signInWithGithub}>
                Sign in with Github
            </button>
        </div>
    )
}

function SignOut() {
    return auth.currentUser && (
    <button className='btn btn-error' onClick={() => auth.signOut()} >Sign Out</button>
    )
}

function ChatRoom({ user }) {
    const [text, setText] = useState('')
    const messageRef = collection(db, 'messages')
    const messageQuery = query(messageRef, orderBy('createdAt'))

    const [snapshot] = useCollection(messageQuery)
    const bottomOfChat = useRef(null)

    useEffect(() => {
        bottomOfChat.current?.scrollIntoView({ behavior: 'smooth' })
    }, [snapshot])

    const handleSend = async (e) => {
        e.preventDefault()
        try {
            const docRef = await addDoc(collection(db, 'messages'), {
                'uid': user.uid,
                'displayName': user.displayName,
                'createdAt': serverTimestamp(),
                'text': text,
            });
            setText('')
        } catch (error) {
            console.log('Error sending message: ', error)
        }
    }

    return(
        <div>
            <div className='divider' />
            <main className='overflow-auto h-200 w-300' >
                {snapshot?.docs.map(doc => <Message key={doc.id} message={{ id: doc.id, ...doc.data() }} />)}
                <div ref={bottomOfChat} ></div>
            </main>
            <div className='divider' />
            <form onSubmit={handleSend} className='flex flex-row justify-center' >
                <input value={text} onChange={(e) => setText(e.target.value)} className='input' />
                <button className='btn btn-success' >Send</button>
            </form>
        </div>
    )
}

function Message({ message }) {
    const { text, displayName, createdAt } = message

    return(
        <div>
            <p><strong>{displayName}</strong>: {text}</p>
            <small>{createdAt?.toDate().toLocaleString()}</small>
        </div>    
    )
}

export default App
