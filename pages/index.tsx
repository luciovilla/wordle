import { useState, useEffect } from 'react'

import { AboutModal } from '../components/modals/AboutModal'
import { Alert } from '../components/alerts/Alert'
import { Grid } from '../components/grid/Grid'
import { InfoModal } from '../components/modals/InfoModal'
import { Keyboard } from '../components/keyboard/Keyboard'
import Meta from '../components/Meta'
import { StatsModal } from '../components/modals/StatsModal'
import { WIN_MESSAGES } from '../constants/strings'

import { isWordInWordList, isWinningWord, solution } from '../lib/words'
import { addStatsForCompletedGame, loadStats } from '../lib/stats'
import { loadGameStateFromLocalStorage, saveGameStateToLocalStorage } from '../lib/localStorage'
import { WORDS } from '../constants/wordlist'

const wordInfo = WORDS.find((w) => {
  return w.word === solution.toLocaleLowerCase()
})

const ALERT_TIME_MS = 2000

const Index = () => {
  const [currentGuess, setCurrentGuess] = useState('')
  const [successAlert, setSuccessAlert] = useState('')
  const [isGameWon, setIsGameWon] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [isNotEnoughLetters, setIsNotEnoughLetters] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isWordNotFoundAlertOpen, setIsWordNotFoundAlertOpen] = useState(false)
  const [isGameLost, setIsGameLost] = useState(false)
  const [guesses, setGuesses] = useState<string[]>(() => {
    const loaded = loadGameStateFromLocalStorage()
    if (loaded?.solution !== solution) {
      return []
    }
    const gameWasWon = loaded.guesses.includes(solution)
    if (gameWasWon) {
      setIsGameWon(true)
    }
    if (loaded.guesses.length === 6 && !gameWasWon) {
      setIsGameLost(true)
    }
    return loaded.guesses
  })
  const [stats, setStats] = useState(() => loadStats())

  useEffect(() => {
    saveGameStateToLocalStorage({ guesses, solution })
  }, [guesses])

  useEffect(() => {
    if (isGameWon) {
      setSuccessAlert(WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)])
      setTimeout(() => {
        setSuccessAlert('')
        setIsStatsModalOpen(true)
      }, ALERT_TIME_MS)
    }
    if (isGameLost) {
      setTimeout(() => {
        setIsStatsModalOpen(true)
      }, ALERT_TIME_MS)
    }
  }, [isGameWon, isGameLost])

  const onChar = (value: string) => {
    if (currentGuess.length < 6 && guesses.length < 6 && !isGameWon) {
      setCurrentGuess(`${currentGuess}${value}`)
    }
  }

  const onDelete = () => {
    setCurrentGuess(currentGuess.slice(0, -1))
  }

  const onEnter = () => {
    if (isGameWon || isGameLost) {
      return
    }
    if (!(currentGuess.length === 6)) {
      setIsNotEnoughLetters(true)
      return setTimeout(() => {
        setIsNotEnoughLetters(false)
      }, ALERT_TIME_MS)
    }

    if (!isWordInWordList(currentGuess)) {
      setIsWordNotFoundAlertOpen(true)
      return setTimeout(() => {
        setIsWordNotFoundAlertOpen(false)
      }, ALERT_TIME_MS)
    }

    const winningWord = isWinningWord(currentGuess)

    if (currentGuess.length === 6 && guesses.length < 6 && !isGameWon) {
      setGuesses([...guesses, currentGuess])
      setCurrentGuess('')

      if (winningWord) {
        setStats(addStatsForCompletedGame(stats, guesses.length))
        return setIsGameWon(true)
      }

      if (guesses.length === 5) {
        setStats(addStatsForCompletedGame(stats, guesses.length + 1))
        setIsGameLost(true)
      }
    }
  }

  return (
    <>
      <Meta />
      <div className="py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col h-screen justify-between">
        <div className="flex flex-col max-w-md mx-auto items-center sm:mb-1">
          <div className="flex items-center w-full mb-1">
            <h1 className="text-3xl sm:text-4xl grow font-bold">La Palabra</h1>
            <button
              className="p-2 flex items-center justify-center rounded mx-0.5 text-xs font-medium cursor-pointer select-none bg-slate-200 hover:bg-slate-300 active:bg-slate-400"
              onClick={() => setIsInfoModalOpen(true)}
            >
              How to play
            </button>
            <button
              className="p-2 flex items-center justify-center rounded mx-0.5 text-xs font-medium cursor-pointer select-none bg-slate-200 hover:bg-slate-300 active:bg-slate-400"
              onClick={() => setIsStatsModalOpen(true)}
            >
              Stats
            </button>
          </div>
          <div className="max-w-sm mb-2 sm:mb-8">
            <h2 className="sm:text-lg">
              Today's word appears in Bad Bunny's song{' '}
              <span className="italic font-medium">{wordInfo.song}</span> (
              <a
                href={wordInfo.spotifyUrl}
                className="underline text-gray-500 hover:text-gray-600 transition"
                target="_blank"
                rel="noreferrer"
              >
                hear it on Spotify
              </a>
              ).
            </h2>
          </div>
        </div>
        <Grid guesses={guesses} currentGuess={currentGuess} />
        <div>
          <Keyboard
            onChar={onChar}
            onDelete={onDelete}
            onEnter={onEnter}
            guesses={guesses}
            isGameWon={isGameWon}
          />
          <button
            type="button"
            className="mx-auto mt-8 flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-black bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
            onClick={() => setIsAboutModalOpen(true)}
          >
            About this game
          </button>
        </div>

        <InfoModal isOpen={isInfoModalOpen} handleClose={() => setIsInfoModalOpen(false)} />
        <StatsModal
          isOpen={isStatsModalOpen}
          handleClose={() => setIsStatsModalOpen(false)}
          gameStats={stats}
          guesses={guesses}
          isGameLost={isGameLost}
          isGameWon={isGameWon}
          handleShare={() => {
            setSuccessAlert('Game copied to clipboard')
            return setTimeout(() => setSuccessAlert(''), ALERT_TIME_MS)
          }}
        />
        <AboutModal isOpen={isAboutModalOpen} handleClose={() => setIsAboutModalOpen(false)} />
        <Alert message="Not enough letters" isOpen={isNotEnoughLetters} />
        <Alert message="Word not found" isOpen={isWordNotFoundAlertOpen} />
        <Alert message={`The word was ${solution}.`} isOpen={isGameLost} />
        <Alert message={successAlert} isOpen={successAlert !== ''} variant="success" />
      </div>
    </>
  )
}

export default Index
