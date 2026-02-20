# KON-NECT: Project Architecture & System Diagrams

This document provides a comprehensive visual breakdown of how the KON-NECT application works, explaining the logic for everyone in a simple way.

---

## 🏗️ 1. How the System Works
This map shows how the App, the Brain (Back-end), and the Data interact to provide a seamless experience.

```mermaid
graph TD
    User((User))
    
    subgraph "The App (Your Device)"
        UI[Main Interface]
        Map[Interactive Map]
        Route[Navigation Guide]
        LiveLink[Real-time Connection]
    end
    
    subgraph "The Brain (Central Logic)"
        Gateway[Data Gateway]
        ChatHost[Chat System]
        SecureAuth[Secure Login Handler]
        SmartMatch[Interest Link Engine]
    end
    
    subgraph "Storage & External Services"
        Database[(Primary Database)]
        PlaceSearch((Location Search))
        RouteSvc((Map Route Service))
    end
    
    User <--> UI
    UI --> Map
    LiveLink <--> ChatHost
    Map <--> RouteSvc
    Map <--> PlaceSearch
    Gateway <--> SmartMatch
    SmartMatch <--> Database
    Gateway <--> SecureAuth
```

---

## 💾 2. Information Structure
This shows how users, friends, and interests are organized and connected.

```mermaid
erDiagram
    USER ||--o{ FRIEND-REQUEST : "Sends/Receives"
    USER ||--o{ CUSTOM-INTEREST : "Creates Tags"
    USER ||--o{ FRIENDSHIP : "Mutual Link"
    USER ||--o{ MESSAGE : "History"
    FRIENDSHIP }o--|| USER : "Connects to"

    USER {
        String ID PK
        String Name "Visible Name"
        String Email UK
        String Photo "Profile Picture"
        String Bio "Personal Description"
        String[] Interests "Hobbies & Tags"
        Point Location "GPS Coordinates"
        Date LastActive
    }

    FRIEND-REQUEST {
        String ID PK
        String From FK
        String To FK
        String Status "Pending / Cancelled"
        Date TimeSent
    }

    MESSAGE {
        String ID PK
        String RoomID "Private Chat"
        String Sender FK
        String Content "Persistent Text"
        Boolean Read "Status notification"
    }

    CUSTOM-INTEREST {
        String ID PK
        String Name "Custom Tag"
        String CreatedBy FK
    }
```

---

## 🔐 3. Secure Login Process
A simple step-by-step guide on how you sign in securely.

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant L as Login Service
    participant I as Identity Provider
    participant D as Database

    U->>A: Click Login
    A->>L: Request Secure Entry
    L->>I: Verify Identity
    I-->>L: Confirm User Info
    L->>D: Find Account Record
    D-->>L: Profile Found
    L->>L: Start Secure Session
    L-->>A: Redirect to Dashboard
    A->>A: Save Login State
    Note over A, L: You stay logged in for your session
```

---

## 🧠 4. Compatibility Logic
The intelligence that determines if two people are a good match.

```mermaid
graph TD
    U1[Person A Profile] --> Data[Analyze Interests & GPS]
    U2[Person B Profile] --> Data
    
    Data --> Distance[Check Current Distance]
    Distance --> Range{Within 20km?}
    
    Range -- "Yes" --> Link[Create Connection Path]
    Range -- "No" --> NoMatch([Too Far Apart])
    
    Link --> Algorithm[Process Matching Algorithm]
    Algorithm --> Score[Calculate Match Level]
    Score --> Logic{Final Decision}
    
    Data --> Common{Shared Interests?}
    Common -- "Yes" --> Logic
    Common -- "No" --> NoMatch
    
    Logic --> Match([Found a Match!])
```

---

## 🔍 5. People Discovery Flow
How the app finds and displays people around you.

```mermaid
graph LR
    Start([Live Location Update]) --> Hub[Stats Hub]
    Hub --> Search[Search Local Area]
    Search --> Range[Follow Within 20km]
    
    subgraph "Intelligent Checks"
        ReverseGeo["Reverse Geocode (Places)"]
        Match{Match Interests?}
        Global{Global View?}
    end
    
    Range --> Match
    Global -- "On" --> ShowAll[Show All Users]
    Match -- "Yes" --> Calc[Determine Best Matches]
    
    Calc --> Sort[Sort Results]
    Sort --> MapPins([Live Pins on Map])
    ShowAll --> MapPins
    
    MapPins --> ReverseGeo
    
    MapPins --> Groups["Group by Interests"]
```

---

## 🤝 6. Connecting with Friends
The workflow of managing your social connections.

```mermaid
stateDiagram-v2
    [*] --> StartRequest : Send Friend Request
    
    state StartRequest {
        direction TB
        Sent --> Accepted : Friend Clicks Accept
        Sent --> Rejected : Friend Clicks Denies
        Sent --> Cancelled : You Click Withdraw
    }
    
    Accepted --> Connected : Dual Link in System
    Rejected --> Sent : You can resend later
    
    Connected --> [*] : Unfriend or Delete Account
```

---

## 💬 7. Instant Updates & Chat
How messages and location updates travel instantly while respecting privacy.

```mermaid
sequenceDiagram
    participant Me as You
    participant Hub as Central Hub
    participant Peer as Nearby Person

    Me->>Hub: Live Tracking Start (Watch)
    Peer->>Hub: Live Tracking Start (Watch)

    rect rgba(200, 200, 200, 0.1)
    Note over Me, Hub: Dynamic Route Tailing
    Me->>Hub: Movement Updates
    Hub->>Hub: Slice Route Line Behind User
    Hub->>Me: Redraw Active Path
    end

    rect rgba(0, 100, 255, 0.1)
    Note over Me, Peer: Persistent Messaging
    Me->>Hub: Send Message (Save to DB)
    Hub->>Peer: Direct Notification
    Peer->>Hub: Mark as Read
    Hub->>Me: Read Confirmation
    end
```

---

## 🗺️ 8. App Navigation Map
The simple structure of the app screens.

```mermaid
graph TD
    App[App Home] --> Settings[Settings & Sync]
    Settings --> Account[Account Security]
    Settings --> Display[Theme & Appearance]
    
    App --> Flow[App Screens]
    Flow --> Landing[Welcome Screen]
    Flow --> Login[Entry Gate]
    Flow --> Explorer[Main Exploratory Hub]
    
    Explorer --> SocialMap[Live Social Map]
    Explorer --> FriendsList[My Connections]
    Explorer --> Navigation[Direction Guide]
    Explorer --> ChatBox[Chat Interface]
```
