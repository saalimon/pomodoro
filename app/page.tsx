"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings, Play, Pause, RotateCcw, Plus, Trash2 } from "lucide-react"

type TimerMode = "pomodoro" | "shortBreak" | "longBreak"

interface Task {
  id: string
  text: string
  completed: boolean
}

interface TimerSettings {
  pomodoro: number
  shortBreak: number
  longBreak: number
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("pomodoro")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [completedPomodoros, setCompletedPomodoros] = useState(0)

  const [settings, setSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Initialize timer based on current mode
  useEffect(() => {
    const minutes = settings[mode]
    setTimeLeft(minutes * 60)
  }, [mode, settings])

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    // Auto-switch modes when timer reaches 0
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      if (mode === "pomodoro") {
        setCompletedPomodoros((prev) => prev + 1)
        // Switch to long break after 4 pomodoros, otherwise short break
        const nextMode = (completedPomodoros + 1) % 4 === 0 ? "longBreak" : "shortBreak"
        setMode(nextMode)
      } else {
        setMode("pomodoro")
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, mode, completedPomodoros])

  // Wake lock management effect
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && isRunning) {
          wakeLockRef.current = await navigator.wakeLock.request("screen")
          console.log("[v0] Wake lock activated")
        }
      } catch (err) {
        console.log("[v0] Wake lock failed:", err)
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log("[v0] Wake lock released")
      }
    }

    if (isRunning) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    // Cleanup on unmount
    return () => {
      releaseWakeLock()
    }
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(settings[mode] * 60)
  }

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode)
    setIsRunning(false)
  }

  const handleSettingsUpdate = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    setShowSettings(false)
  }

  const addTask = () => {
    if (newTask.trim()) {
      setTasks((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: newTask.trim(),
          completed: false,
        },
      ])
      setNewTask("")
    }
  }

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const getModeLabel = (mode: TimerMode) => {
    switch (mode) {
      case "pomodoro":
        return "Pomodoro"
      case "shortBreak":
        return "Short Break"
      case "longBreak":
        return "Long Break"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Pomodoro Timer</h1>
          <p className="text-muted-foreground">Stay focused and productive</p>
        </div>

        {/* Timer Card */}
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-sm">
                Session {completedPomodoros + 1}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-2xl">{getModeLabel(mode)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Selector */}
            <div className="flex justify-center space-x-2">
              <Button
                variant={mode === "pomodoro" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("pomodoro")}
              >
                Pomodoro
              </Button>
              <Button
                variant={mode === "shortBreak" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("shortBreak")}
              >
                Short Break
              </Button>
              <Button
                variant={mode === "longBreak" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("longBreak")}
              >
                Long Break
              </Button>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-8xl font-mono font-bold text-foreground mb-4">{formatTime(timeLeft)}</div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                {!isRunning ? (
                  <Button onClick={handleStart} size="lg" className="px-8">
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="lg" className="px-8">
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                <h3 className="font-semibold">Timer Settings (minutes)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pomodoro">Pomodoro</Label>
                    <Input
                      id="pomodoro"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.pomodoro}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          pomodoro: Number.parseInt(e.target.value) || 25,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="shortBreak">Short Break</Label>
                    <Input
                      id="shortBreak"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.shortBreak}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shortBreak: Number.parseInt(e.target.value) || 5,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="longBreak">Long Break</Label>
                    <Input
                      id="longBreak"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.longBreak}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          longBreak: Number.parseInt(e.target.value) || 15,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tasks
              <Badge variant="secondary">
                {tasks.filter((t) => t.completed).length}/{tasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Task */}
            <div className="flex space-x-2">
              <Input
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTask()}
              />
              <Button onClick={addTask} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Task List */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tasks yet. Add one above to get started!</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-2 rounded border">
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                    <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.text}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Completed Pomodoros Today</p>
              <p className="text-3xl font-bold">{completedPomodoros}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
