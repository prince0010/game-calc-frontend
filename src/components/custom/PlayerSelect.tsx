import {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '../ui/input'
import { X } from 'lucide-react'
import { useMutation, gql } from '@apollo/client'

interface Player {
    _id: string
    name: string
    role?: string
}

interface PlayerSelectProps {
    players: Player[]
    selectedPlayers: string[]
    tempSelectedPlayers?: string[]
    onSelectPlayer: (playerId: string) => void
    onToggleTempSelection?: (playerId: string) => void
    onRemovePlayer?: (playerId: string) => void
    refetchUsers: () => void
    onCreatePlayer?: (name: string) => Promise<string | null>
}

const CREATE_USER = gql`
    mutation CreateUser($input: UserInput!) {
        createUser(input: $input) {
            _id
            name
        }
    }
`

export const PlayerSelect = forwardRef<
    { handleAddPlayer: () => Promise<string | null> },
    PlayerSelectProps
>(
    (
        {
            players: initialPlayers,
            selectedPlayers,
            tempSelectedPlayers = [],
            onSelectPlayer,
            onToggleTempSelection,
            onRemovePlayer,
            refetchUsers,
            onCreatePlayer,
        },
        ref
    ) => {
        useImperativeHandle(ref, () => ({
            handleAddPlayer: () => handleAddPlayer(),
        }))

        const [searchQuery, setSearchQuery] = useState('')
        const [isDropdownOpen, setIsDropdownOpen] = useState(false)
        const dropdownRef = useRef<HTMLDivElement>(null)
        const inputRef = useRef<HTMLInputElement>(null)
        const [players, setPlayers] = useState<Player[]>(initialPlayers)

        useEffect(() => {
            setPlayers(initialPlayers)
        }, [initialPlayers])

        const [createUser] = useMutation(CREATE_USER, {
            onCompleted: (data) => {
                const newUser = data.createUser
                setPlayers((prev) => [...prev, newUser])
                onSelectPlayer(newUser._id)
                refetchUsers()
            },
            onError: (error) => {
                console.error('Error creating user:', error)
            },
        })

        const filteredPlayers = players.filter((player) =>
            player.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(e.target.value)
            setIsDropdownOpen(!!e.target.value)
        }

        const handleAddPlayer = async (): Promise<string | null> => {
            const newPlayerName = searchQuery.trim()
            if (!newPlayerName) return null

            const existingPlayer = players.find(
                (player) =>
                    player.name.toLowerCase() === newPlayerName.toLowerCase()
            )

            if (existingPlayer) {
                onSelectPlayer(existingPlayer._id)
                if (onToggleTempSelection){
                    onToggleTempSelection(existingPlayer._id)
                }
                return existingPlayer._id
            } else {
                try {
                    if (onCreatePlayer) {
                        const newPlayerId = await onCreatePlayer(newPlayerName)
                        if (newPlayerId && onToggleTempSelection) {
                            onToggleTempSelection(newPlayerId)
                        }
                        return newPlayerId
                    } else {
                        const response = await createUser({
                            variables: {
                                input: { name: newPlayerName, role: 'user' },
                            },
                        })
                        return response.data.createUser._id
                    }
                } catch (error) {
                    console.error('Failed to create user:', error)
                    return null
                }
            }
        }

        const handleKeyDown = async (
            e: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                await handleAddPlayer()
            }
        }

        const handleClearInput = () => {
            setSearchQuery('')
            setIsDropdownOpen(true)
            inputRef.current?.focus()
        }

        const handlePlayerToggle = (playerId: string) => {
            if (selectedPlayers.includes(playerId)) {
                // If player is in selectedPlayers (permanent selection), remove them
                if (onRemovePlayer) {
                    onRemovePlayer(playerId)
                }
            } else if (tempSelectedPlayers?.includes(playerId)) {
                // If player is in tempSelectedPlayers, toggle them
                if (onToggleTempSelection) {
                    onToggleTempSelection(playerId)
                }
            } else {
                // If player is not selected at all, add them
                if (onToggleTempSelection) {
                    onToggleTempSelection(playerId)
                } else {
                    onSelectPlayer(playerId)
                }
            }
        }

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    inputRef.current &&
                    inputRef.current.contains(event.target as Node)
                ) {
                    return
                }

                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target as Node)
                ) {
                    if (!searchQuery) {
                        setIsDropdownOpen(false)
                    }
                }
            }

            document.addEventListener('mousedown', handleClickOutside)
            return () =>
                document.removeEventListener('mousedown', handleClickOutside)
        }, [searchQuery])

        return (
            <div className="relative space-y-2" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700">
                    Select Player(s)
                </label>
                {/* Search Input and Dropdown */}
                <div className="relative">
                    <Input
                        ref={inputRef}
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={() => setIsDropdownOpen(true)}
                        onKeyDown={handleKeyDown}
                        className="pr-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearInput}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    )}

                    {/* Search Results Dropdown */}
                    {isDropdownOpen && searchQuery && (
                        <div className="absolute z-10 w-full bg-popover text-popover-foreground border rounded-md shadow-lg bottom-full mb-1 max-h-60 overflow-auto">
                            {filteredPlayers.length > 0 ? (
                                filteredPlayers.map((player) => {
                                    const isSelected =
                                        selectedPlayers.includes(player._id) ||
                                        tempSelectedPlayers?.includes(
                                            player._id
                                        )
                                    return (
                                        <div
                                            key={player._id}
                                            className={`flex items-center gap-3 p-2 hover:bg-green-100 cursor-pointer ${
                                                isSelected ? 'bg-green-100' : ''
                                            }`}
                                        >
                                            <Checkbox
                                                id={player._id}
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    handlePlayerToggle(
                                                        player._id
                                                    )
                                                }
                                                className="text-green-500 border-green-300"
                                            />
                                            <label
                                                htmlFor={player._id}
                                                className="text-sm flex-1 cursor-pointer py-1.5"
                                            >
                                                {player.name}
                                            </label>
                                        </div>
                                    )
                                })
                            ) : (
                                <div
                                    className="flex items-center gap-2 p-3 hover:bg-green-100 cursor-pointer text-sm text-green-500"
                                    onClick={handleAddPlayer}
                                >
                                    <span>{`+ Create "${searchQuery}"`}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Selected Players Row */}
                {(selectedPlayers.length > 0 ||
                    (tempSelectedPlayers?.length || 0) > 0) && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                            Selected player(s):
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(
                                new Set([
                                    ...selectedPlayers,
                                    ...(tempSelectedPlayers || []),
                                ])
                            ).map((playerId) => {
                                const player = players.find(
                                    (p) => p._id === playerId
                                )
                                return player ? (
                                    <div
                                        key={playerId}
                                        className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                                    >
                                        <span>{player.name}</span>
                                        <button
                                            onClick={() =>
                                                handlePlayerToggle(playerId)
                                            }
                                            className="text-green-600 hover:text-green-700"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : null
                            })}
                        </div>
                    </div>
                )}
            </div>
        )
    }
)

PlayerSelect.displayName = 'PlayerSelect'
