import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import { useMutation, gql } from "@apollo/client";

interface Player {
  _id: string;
  name: string;
  role?: string;
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
`;

export const PlayerSelect = forwardRef<
  { handleAddPlayer: () => Promise<string | null> },
  PlayerSelectProps
>(({ players: initialPlayers, 
  selectedPlayers, 
  tempSelectedPlayers = [], 
  onSelectPlayer, 
  onToggleTempSelection,
  onRemovePlayer,
  refetchUsers, 
  onCreatePlayer
}, ref) => {
  useImperativeHandle(ref, () => ({
    handleAddPlayer: () => handleAddPlayer(),
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      const newUser = data.createUser;
      setPlayers((prev) => [...prev, newUser]);
      onSelectPlayer(newUser._id);
      setSearchQuery("");
      setIsDropdownOpen(false);
      refetchUsers();
    },
    onError: (error) => {
      console.error("Error creating user:", error);
    },
  });

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(!!e.target.value); // Only open dropdown if there's search text
  };

  const handleAddPlayer = async (): Promise<string | null> => {
    const newPlayerName = searchQuery.trim();
    if (!newPlayerName) return null;

    const existingPlayer = players.find(
      (player) => player.name.toLowerCase() === newPlayerName.toLowerCase()
    );

    if (existingPlayer) {
      onSelectPlayer(existingPlayer._id);
      setSearchQuery("");
      setIsDropdownOpen(false);
      return existingPlayer._id;
    } else {
      try {
        if (onCreatePlayer) {
          const newPlayerId = await onCreatePlayer(newPlayerName);
          setSearchQuery("");
          setIsDropdownOpen(false);
          return newPlayerId;
        } else {
          const response = await createUser({
            variables: { input: { name: newPlayerName, role: "user" } },
          });
          return response.data.createUser._id;
        }
      } catch (error) {
        console.error("Failed to create user:", error);
        return null;
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const playerId = await handleAddPlayer();
      if (playerId) {
        setSearchQuery("");
        setIsDropdownOpen(false);
      }
    }
  };

  const handleClearInput = () => {
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  // const handlePlayerToggle = (playerId: string) => {
  //   onSelectPlayer(playerId);
  //   setSearchQuery("");
  //   setIsDropdownOpen(false);
  // };

  // const handleRemovePlayer = (playerId: string) => {
  //   onSelectPlayer(playerId);
  // };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Search players..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchQuery) {
              setIsDropdownOpen(true);
            }
          }}
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
      </div>

      {/* Selected Players Display - Only shows when not searching */}
      {/* {selectedPlayers.length > 0 && !searchQuery && !isDropdownOpen && (
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Selected players ({selectedPlayers.length})
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-1">
            {Array.from({ length: Math.ceil(selectedPlayers.length / 5) }).map((_, colIndex) => (
              <ul key={colIndex} className="flex-1 min-w-[200px] space-y-1">
                {selectedPlayers
                  .slice(colIndex * 5, (colIndex + 1) * 5)
                  .map((playerId) => {
                    const player = players.find((p) => p._id === playerId);
                    return player ? (
                      <li key={playerId} className="flex items-center gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span 
                          className="text-sm hover:text-destructive cursor-pointer"
                          onClick={() => onRemovePlayer && onRemovePlayer(playerId)}
                        >
                          {player.name}
                        </span>
                      </li>
                    ) : null;
                  })}
              </ul>
            ))}
          </div>
        </div>
      )} */}

      {/* Temporary Selected Players (checked but not added) */}
      {(selectedPlayers.length > 0 || tempSelectedPlayers.length > 0) && !searchQuery && !isDropdownOpen && (
  <div className="rounded-lg border p-3 mt-2">
    <p className="text-sm font-medium text-muted-foreground mb-2">
      Selected Players
    </p>
    {(() => {
      const uniquePlayerIds = Array.from(new Set([...selectedPlayers, ...tempSelectedPlayers]));
      const maxPlayersPerColumn = 5; // Set default max players per column
      const numberOfColumns = Math.ceil(uniquePlayerIds.length / maxPlayersPerColumn);
      const gridClass = numberOfColumns >= 3 ? "grid grid-cols-3 gap-4" : 
                       numberOfColumns === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : 
                       "grid grid-cols-3 gap-4";

      return (
        <div className={gridClass}>
          {Array.from({ length: numberOfColumns }).map((_, colIndex) => (
            <ul key={colIndex} className="space-y-1">
              {uniquePlayerIds
                .slice(colIndex * maxPlayersPerColumn, (colIndex + 1) * maxPlayersPerColumn)
                .map((playerId) => {
                  const player = players.find((p) => p._id === playerId);
                  const isAlreadyAdded = selectedPlayers.includes(playerId);
                  const isPending = tempSelectedPlayers.includes(playerId);

                  return player ? (
                    <li key={playerId} className="flex items-center gap-2">
                      <span className={`text-lg ${isAlreadyAdded ? "text-green-500" : "text-red-500"}`}>
                        •
                      </span>
                      <span
                        className="text-sm hover:text-destructive cursor-pointer"
                        onClick={() => {
                          if (isPending && onToggleTempSelection) {
                            onToggleTempSelection(playerId);
                          } else if (onRemovePlayer) {
                            onRemovePlayer(playerId);
                          }
                        }}
                      >
                        {player.name}
                      </span>
                    </li>
                  ) : null;
                })}
            </ul>
          ))}
        </div>
      );
    })()}
  </div>
)}
      {/* Search Results Dropdown */}
      {isDropdownOpen && searchQuery && (
        <div className="absolute z-10 w-full bg-popover text-popover-foreground border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player._id}
                className="flex items-center gap-3 p-2 hover:bg-accent cursor-pointer"
                // onClick={() => onToggleTempSelection && onToggleTempSelection(player._id)} // Uncomment lang ni if ang gusto na mag search og dili ma exit ang gipang search kung mag select na
                onClick={() => {
                  if (onToggleTempSelection) onToggleTempSelection(player._id);
                  setSearchQuery("")
                  setIsDropdownOpen(false)
                }}
              >
                <Checkbox
                  id={player._id}
                  checked={tempSelectedPlayers.includes(player._id) || selectedPlayers.includes(player._id)}
                  // onCheckedChange={() => onToggleTempSelection && onToggleTempSelection(player._id)} // Uncomment lang ni if ang gusto na mag search og dili ma exit ang gipang search kung mag select na
                  onCheckedChange={() => {
                    if (onToggleTempSelection) onToggleTempSelection(player._id);
                    setSearchQuery("");
                    setIsDropdownOpen(false);
                  }}
                />
                <label htmlFor={player._id} className="text-sm flex-1 cursor-pointer py-1.5">
                  {player.name}
                </label>
              </div>
            ))
          ) : (
            <div 
              className="flex items-center gap-2 p-3 hover:bg-accent cursor-pointer text-sm text-primary"
              onClick={handleAddPlayer}
            >
              <span>{`+ Create "${searchQuery}"`}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

PlayerSelect.displayName = "PlayerSelect";