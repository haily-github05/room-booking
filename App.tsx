import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./src/firebase";

type Room = {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  available: boolean;
};

type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  building: string;
  slot: string;
  purpose: string;
  bookedBy: string;
  createdAt?: unknown;
};


const slots = [
  "08:00-09:00",
  "09:00-10:00",
  "14:00-15:00",
];

type RoomCardProps = {
  room: Room;
  onSelect: (room: Room) => void;
  isSelected: boolean;
};

function RoomCard({
  room,
  onSelect,
  isSelected,
}: RoomCardProps) {
  return (
    <View
      style={[
        styles.roomCard,
        isSelected && styles.selectedRoomCard,
      ]}
    >
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>

        <Text style={styles.roomDetail}>
          Building: {room.building}
        </Text>

        <Text style={styles.roomDetail}>
          Floor: {room.floor ?? "Not specified"}
        </Text>

        <Text style={styles.roomDetail}>
          Capacity: {room.capacity} people
        </Text>

        <Text
          style={[
            styles.status,
            room.available
              ? styles.available
              : styles.unavailable,
          ]}
        >
          {room.available ? "Available" : "Unavailable"}
        </Text>
      </View>

      <Pressable
        style={[
          styles.selectButton,
          (!room.available || isSelected) &&
            styles.disabledButton,
        ]}
        disabled={!room.available || isSelected}
        onPress={() => onSelect(room)}
      >
        <Text style={styles.buttonText}>
          {isSelected ? "Selected" : "Select"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [selectedRoom, setSelectedRoom] =
    useState<Room | null>(null);

  const [selectedSlot, setSelectedSlot] = useState("");

  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedBy, setBookedBy] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const roomsQuery = collection(db, "rooms");

    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const roomList: Room[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            name: data.name ?? "Unnamed room",
            building: data.building ?? "N/A",
            floor: data.floor ?? 0,
            capacity: data.capacity ?? 0,
            available: data.available ?? false,
          };
        });

        setRooms(roomList);
        setLoadingRooms(false);

        setSelectedRoom((currentRoom) => {
          if (!currentRoom) return null;

          return (
            roomList.find(
              (room) => room.id === currentRoom.id
            ) ?? null
          );
        });
      },
      (error) => {
        console.error("Error loading rooms:", error);
        setErrorMessage("Unable to load rooms from Firebase.");
        setLoadingRooms(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const bookingList: Booking[] = snapshot.docs.map(
          (doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              roomId: data.roomId ?? "",
              roomName: data.roomName ?? "Unknown room",
              building: data.building ?? "N/A",
              slot: data.slot ?? "",
              purpose: data.purpose ?? "",
              bookedBy: data.bookedBy ?? "",
              createdAt: data.createdAt,
            };
          }
        );

        setBookings(bookingList);
      },
      (error) => {
        console.error("Error loading bookings:", error);
        setErrorMessage(
          "Unable to load bookings. Check your Firebase configuration."
        );
      }
    );

    return unsubscribe;
  }, []);

  const totalRooms = rooms.length;
  
  const visibleRooms = rooms.filter((room) => {
    const matchesBuilding =
      selectedBuilding === "ALL" ||
      room.building === selectedBuilding;

    const matchesAvailability =
      !availableOnly || room.available;

    return matchesBuilding && matchesAvailability;
  });


  const availableRooms = rooms.filter(
    (room) => room.available
  ).length;

  const totalBookings = bookings.length;


  const handleBookRoom = async () => {
    setMessage("");
    setErrorMessage("");

    if (!selectedRoom) {
      setErrorMessage("Please select a room first.");
      return;
    }

    if (!selectedRoom.available) {
      setErrorMessage("This room is currently unavailable.");
      return;
    }

    if (!selectedSlot) {
      setErrorMessage("Please select a time slot.");
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage("Please enter the booking purpose.");
      return;
    }
    if (!bookedBy.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    try {
      setIsBooking(true);

      await addDoc(collection(db, "bookings"), {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        building: selectedRoom.building,
        slot: selectedSlot,
        purpose: purpose.trim(),
        createdAt: serverTimestamp(),
        bookedBy: bookedBy.trim(),
      });

      setMessage(
        `Successfully booked ${selectedRoom.name} for ${selectedSlot}.`
      );

      setSelectedRoom(null);
      setSelectedSlot("");
      setPurpose("");
      setBookedBy("");
    } catch (error) {
      console.error("Error creating booking:", error);
      setErrorMessage(
        "Booking failed. Please check your Firebase connection."
      );
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      {/* HEADER */}

      <Text style={styles.title}>Room Booking</Text>

      <Text style={styles.subtitle}>
        Find a room and book your preferred time slot.
      </Text>

      {/* STATISTICS */}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {totalRooms}
          </Text>
          <Text style={styles.statLabel}>Total Rooms</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {availableRooms}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {totalBookings}
          </Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
      </View>

      {/* ROOM LIST */}

      <Text style={styles.sectionTitle}>Available Rooms</Text>
      
      <View style={styles.filterContainer}>
        {["ALL", "Block A", "Block B"].map((building) => (
          <Pressable
            key={building}
            onPress={() => setSelectedBuilding(building)}
            style={[
              styles.filterButton,
              selectedBuilding === building &&
                styles.activeFilterButton,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedBuilding === building &&
                  styles.activeFilterText,
              ]}
            >
              {building}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => setAvailableOnly((current) => !current)}
          style={[
            styles.filterButton,
            availableOnly && styles.activeFilterButton,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              availableOnly && styles.activeFilterText,
            ]}
          >
            {availableOnly ? "✓ Available Only" : "Available Only"}
          </Text>
        </Pressable>
      </View>


      {loadingRooms ? (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      ) : rooms.length === 0 ? (
        <Text style={styles.emptyText}>
          No rooms found in Firebase.
        </Text>
      ) : visibleRooms.length === 0 ? (
        <Text style={styles.emptyText}>
          No rooms match the selected filters.
        </Text>
      ) : (
        <View style={styles.roomListContainer}>
          <FlatList
            data={visibleRooms}
            scrollEnabled={false}
            nestedScrollEnabled
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RoomCard
                room={item}
                onSelect={(room) => {
                  setSelectedRoom(room);
                  setMessage("");
                  setErrorMessage("");
                }}
                isSelected={
                  selectedRoom?.id === item.id
                }
              />
            )}
          />
        </View>
      )}

      <Pressable
        onPress={() => setAvailableOnly(!availableOnly)}
        style={[
          styles.filterButton,
          availableOnly && styles.activeFilterButton,
        ]}
      >
        <Text
          style={[
            styles.filterText,
            availableOnly && styles.activeFilterText,
          ]}
        >
          {availableOnly ? "✓ Available Only" : "Available Only"}
        </Text>
      </Pressable>


      {/* SELECTED ROOM */}

      <Text style={styles.sectionTitle}>
        Selected Room
      </Text>

      <View style={styles.selectedRoomBox}>
        <Text style={styles.selectedRoomText}>
          {selectedRoom
            ? `${selectedRoom.name} - ${selectedRoom.building}`
            : "No room selected"}
        </Text>
      </View>

      {/* TIME SLOT */}

      <Text style={styles.sectionTitle}>Time Slot</Text>

      <View style={styles.slotsContainer}>
        {slots.map((slot) => (
          <Pressable
            key={slot}
            onPress={() => {
              setSelectedSlot(slot);
              setMessage("");
              setErrorMessage("");
            }}
            style={[
              styles.slotButton,
              selectedSlot === slot &&
                styles.selectedSlotButton,
            ]}
          >
            <Text
              style={[
                styles.slotText,
                selectedSlot === slot &&
                  styles.selectedSlotText,
              ]}
            >
              {slot}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* PURPOSE */}

      <Text style={styles.sectionTitle}>
        Booking Purpose
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your booking purpose"
        value={purpose}
        onChangeText={(text) => {
          setPurpose(text);
          setErrorMessage("");
        }}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.sectionTitle}>
        Booked By
      </Text>

      <TextInput
        style={styles.input}
        value={bookedBy}
        onChangeText={setBookedBy}
        placeholder="Your name"
      />


      {/* BOOK BUTTON */}

      <Pressable
        style={[
          styles.bookButton,
          isBooking && styles.disabledButton,
        ]}
        onPress={handleBookRoom}
        disabled={isBooking}
      >
        <Text style={styles.bookButtonText}>
          {isBooking ? "Booking..." : "Book Room"}
        </Text>
      </Pressable>

      {/* MESSAGES */}

      {errorMessage !== "" && (
        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>
      )}

      {message !== "" && (
        <Text style={styles.successMessage}>
          {message}
        </Text>
      )}

      {/* RECENT BOOKINGS */}

      <Text style={styles.sectionTitle}>
        Recent Bookings
      </Text>

      {bookings.length === 0 ? (
        <Text style={styles.emptyText}>
          No bookings yet.
        </Text>
      ) : (
        <View style={styles.bookingsContainer}>
          {bookings.map((booking) => (
            <View
              key={booking.id}
              style={styles.bookingCard}
            >
              <Text style={styles.bookingRoom}>
                {booking.roomName}
              </Text>

              <Text style={styles.bookingDetail}>
                Building: {booking.building}
              </Text>

              <Text style={styles.bookingDetail}>
                Time: {booking.slot}
              </Text>

              <Text style={styles.bookingDetail}>
                Purpose: {booking.purpose}
              </Text>
              <Text style={styles.bookingDetail}>
                Booked by: {booking.bookedBy}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* BOTTOM SPACE */}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  contentContainer: {
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: "center",
    elevation: 2,
  },

  statNumber: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#2563EB",
  },

  statLabel: {
    fontSize: 12,
    color: "#555555",
    marginTop: 5,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222222",
    marginTop: 18,
    marginBottom: 10,
  },

  loader: {
    marginVertical: 20,
  },

  emptyText: {
    fontSize: 14,
    color: "#777777",
    paddingVertical: 12,
  },

  roomListContainer: {
    marginTop: 4,
    marginBottom: 8,
  },

  roomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  selectedRoomCard: {
    borderColor: "#2563EB",
    borderWidth: 2,
    backgroundColor: "#EFF6FF",
  },

  roomInfo: {
    flex: 1,
    paddingRight: 8,
  },

  roomName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 5,
  },

  roomDetail: {
    fontSize: 13,
    color: "#555555",
    marginTop: 3,
  },

  status: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 7,
  },

  available: {
    color: "#15803D",
  },

  unavailable: {
    color: "#DC2626",
  },

  selectButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 7,
  },

  disabledButton: {
    backgroundColor: "#9CA3AF",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  selectedRoomBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  selectedRoomText: {
    color: "#333333",
    fontSize: 14,
  },

  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  slotButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  selectedSlotButton: {
    backgroundColor: "#2563EB",
  },

  slotText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },

  selectedSlotText: {
    color: "#FFFFFF",
  },

  input: {
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#222222",
  },

  bookButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 18,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  errorMessage: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    fontSize: 13,
  },

  successMessage: {
    color: "#15803D",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    fontSize: 13,
  },

  bookingsContainer: {
    gap: 10,
  },

  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  bookingRoom: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 6,
  },

  bookingDetail: {
    fontSize: 13,
    color: "#555555",
    marginTop: 3,
  },

  bottomSpace: {
    height: 20,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },

  activeFilterButton: {
    backgroundColor: "#2563EB",
  },

  filterText: {
    color: "#2563EB",
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },
});
