# **Mastering Firebase: Firestore + Storage CRUD Guide**

## **1. Introduction to Firebase**

Firebase is a comprehensive app development platform that provides backend services like databases, authentication, and file storage. It's perfect for building web and mobile apps quickly without managing server infrastructure.

### **Setting Up Firebase in Your Web App**

```javascript
// Install Firebase SDK
npm install firebase

// Initialize Firebase in your app
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
```

---

## **2. Firestore Database CRUD Operations**

### **📁 Firestore Overview**
- **Collections**: Containers for documents
- **Documents**: Individual records with key-value pairs
- **Real-time updates**: Automatic data synchronization
- **Offline support**: Works without internet connection

---

### **💾 CREATE Operations**

**Explanation**: Add new documents to collections with auto-generated or custom IDs.

```javascript
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";

const db = getFirestore(app);

// Method 1: Auto-generated ID (Recommended for most cases)
await addDoc(collection(db, "users"), {
  name: "Alice Johnson",
  age: 25,
  email: "alice@example.com",
  createdAt: new Date()
});

// Method 2: Custom document ID
await setDoc(doc(db, "users", "custom-user-id"), {
  name: "Bob Smith",
  age: 30,
  email: "bob@example.com",
  createdAt: new Date()
});

// Method 3: Merge to avoid overwriting existing data
await setDoc(doc(db, "users", "user123"), {
  name: "Charlie Brown",
  lastLogin: new Date()
}, { merge: true });
```

**💡 Tips**:
- Use `addDoc` for simple cases where you don't need control over the ID
- Use `setDoc` with `{ merge: true }` to update existing documents without overwriting
- Always include timestamps like `createdAt` and `updatedAt`

---

### **📖 READ Operations**

**Explanation**: Retrieve single documents, query collections, and listen for real-time updates.

```javascript
import { getDoc, getDocs, onSnapshot, collection, query, where, orderBy, limit, doc } from "firebase/firestore";

// Get a single document
const docRef = doc(db, "users", "user123");
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  console.log("User data:", docSnap.data());
} else {
  console.log("No such document!");
}

// Get all documents from a collection
const querySnapshot = await getDocs(collection(db, "users"));
querySnapshot.forEach((doc) => {
  console.log(doc.id, "=>", doc.data());
});

// Query with conditions
const usersQuery = query(
  collection(db, "users"),
  where("age", ">=", 18),
  where("age", "<=", 30),
  orderBy("age", "desc"),
  limit(10)
);

const filteredUsers = await getDocs(usersQuery);
filteredUsers.forEach((doc) => {
  console.log("Filtered user:", doc.data());
});

// Real-time listener for a document
onSnapshot(doc(db, "users", "user123"), (doc) => {
  console.log("Real-time update:", doc.data());
});

// Real-time listener for a collection
const realTimeQuery = query(collection(db, "users"), where("active", "==", true));
onSnapshot(realTimeQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      console.log("New user:", change.doc.data());
    }
    if (change.type === "modified") {
      console.log("Modified user:", change.doc.data());
    }
    if (change.type === "removed") {
      console.log("Removed user:", change.doc.data());
    }
  });
});
```

**💡 Tips**:
- Use `getDoc` for single reads, `getDocs` for multiple documents
- Set up real-time listeners for dynamic data that changes frequently
- Always create composite indexes for complex queries
- Unsubscribe listeners when components unmount to prevent memory leaks

---

### **✏️ UPDATE Operations**

**Explanation**: Modify specific fields without overwriting the entire document.

```javascript
import { updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";

const userRef = doc(db, "users", "user123");

// Update specific fields
await updateDoc(userRef, {
  age: 26,
  email: "alice.new@example.com",
  updatedAt: new Date()
});

// Update nested fields
await updateDoc(userRef, {
  "profile.address.city": "New York",
  "profile.address.zipCode": "10001"
});

// Add to arrays (without duplicates)
await updateDoc(userRef, {
  favorites: arrayUnion("pizza", "sushi")
});

// Remove from arrays
await updateDoc(userRef, {
  favorites: arrayRemove("pizza")
});

// Increment numeric values
await updateDoc(userRef, {
  loginCount: increment(1),
  points: increment(5)
});

// Update multiple documents in batch
import { writeBatch } from "firebase/firestore";

const batch = writeBatch(db);

batch.update(doc(db, "users", "user1"), { status: "active" });
batch.update(doc(db, "users", "user2"), { status: "active" });
batch.update(doc(db, "users", "user3"), { status: "inactive" });

await batch.commit();
```

**💡 Tips**:
- Always use `updateDoc` instead of `setDoc` unless you intend to replace the entire document
- Use `arrayUnion` and `arrayRemove` for array operations to avoid concurrency issues
- Use batch writes for multiple updates to ensure atomic operations
- Include `updatedAt` timestamp in all updates

---

### **🗑️ DELETE Operations**

**Explanation**: Remove documents or specific fields from Firestore.

```javascript
import { deleteDoc, deleteField } from "firebase/firestore";

const userRef = doc(db, "users", "user123");

// Delete entire document
await deleteDoc(userRef);

// Delete specific fields
await updateDoc(userRef, {
  temporaryData: deleteField(),
  oldEmail: deleteField()
});

// Delete multiple documents in batch
const batch = writeBatch(db);

batch.delete(doc(db, "users", "oldUser1"));
batch.delete(doc(db, "users", "oldUser2"));
batch.delete(doc(db, "posts", "oldPost1"));

await batch.commit();
```

**💡 Tips**:
- Deleting a document does NOT delete its subcollections
- Use `deleteField()` to remove specific fields without deleting the entire document
- Always use batch operations for multiple deletions to reduce costs and ensure consistency
- Consider soft deletes (adding `deleted: true` flag) instead of hard deletes for important data

---

## **3. Firebase Storage CRUD Operations**

### **📁 Storage Overview**
- **Buckets**: Containers for files
- **References**: Pointers to specific files
- **Security**: Controlled by Storage Rules
- **Operations**: Upload, download, update, delete files

---

### **💾 UPLOAD Operations**

**Explanation**: Upload files to Firebase Storage with metadata and progress tracking.

```javascript
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const storage = getStorage(app);

// Basic file upload
const fileRef = ref(storage, "images/profile-pictures/user123.jpg");
await uploadBytes(fileRef, file);

// Upload with metadata
const metadata = {
  contentType: "image/jpeg",
  customMetadata: {
    "uploadedBy": "user123",
    "uploadedAt": new Date().toISOString()
  }
};

await uploadBytes(fileRef, file, metadata);

// Upload with progress tracking
const uploadTask = uploadBytesResumable(fileRef, file, metadata);

uploadTask.on("state_changed",
  (snapshot) => {
    // Progress tracking
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log(`Upload is ${progress}% done`);
  },
  (error) => {
    // Handle errors
    console.error("Upload failed:", error);
  },
  async () => {
    // Upload completed successfully
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    console.log("File available at:", downloadURL);
    
    // Save URL to Firestore
    await setDoc(doc(db, "users", "user123"), {
      profileImageUrl: downloadURL,
      updatedAt: new Date()
    }, { merge: true });
  }
);
```

**💡 Tips**:
- Always specify correct content type in metadata
- Use meaningful file paths for better organization
- Track upload progress for large files
- Save download URLs to Firestore for easy access

---

### **📖 DOWNLOAD Operations**

**Explanation**: Retrieve files and their download URLs from Storage.

```javascript
import { getStorage, ref, getDownloadURL, listAll, getMetadata } from "firebase/storage";

const storage = getStorage(app);

// Get download URL for a single file
const fileRef = ref(storage, "images/profile-pictures/user123.jpg");

try {
  const url = await getDownloadURL(fileRef);
  console.log("File URL:", url);
  
  // Use the URL to display or download the file
  const img = document.createElement("img");
  img.src = url;
  document.body.appendChild(img);
  
} catch (error) {
  console.error("Error getting download URL:", error);
}

// Get file metadata
const metadata = await getMetadata(fileRef);
console.log("File metadata:", metadata);

// List all files in a folder
const folderRef = ref(storage, "images/profile-pictures");
const fileList = await listAll(folderRef);

console.log("Files in folder:");
fileList.items.forEach((itemRef) => {
  console.log("File:", itemRef.name);
});

// List with pagination (if many files)
const firstPage = await listAll(folderRef);
console.log("First page:", firstPage.items);
```

**💡 Tips**:
- Download URLs are publicly accessible by default (secure with rules)
- Use `listAll` for small directories, implement pagination for large ones
- Cache download URLs to reduce API calls
- Always handle errors when getting download URLs

---

### **✏️ UPDATE Operations**

**Explanation**: Update file metadata or replace files while keeping the same reference.

```javascript
import { updateMetadata } from "firebase/storage";

const fileRef = ref(storage, "images/profile-pictures/user123.jpg");

// Update file metadata
const newMetadata = {
  contentType: "image/jpeg",
  customMetadata: {
    "updatedBy": "user123",
    "updatedAt": new Date().toISOString(),
    "description": "New profile picture"
  }
};

await updateMetadata(fileRef, newMetadata);

// Replace file content while keeping same reference
const newFile = await fetch("https://example.com/new-image.jpg").then(r => r.blob());
await uploadBytes(fileRef, newFile, newMetadata);

// Get new URL after update
const newUrl = await getDownloadURL(fileRef);

// Update Firestore with new URL
await updateDoc(doc(db, "users", "user123"), {
  profileImageUrl: newUrl,
  updatedAt: new Date()
});
```

**💡 Tips**:
- You cannot rename files directly; upload to new location and delete old one
- Update metadata to add descriptions, tags, or custom properties
- Always update Firestore references when files change
- Consider versioning important files

---

### **🗑️ DELETE Operations**

**Explanation**: Remove files from Firebase Storage.

```javascript
import { deleteObject, listAll } from "firebase/storage";

const storage = getStorage(app);

// Delete a single file
const fileRef = ref(storage, "images/profile-pictures/user123.jpg");
await deleteObject(fileRef);

// Delete file and remove Firestore reference
await deleteObject(fileRef);
await updateDoc(doc(db, "users", "user123"), {
  profileImageUrl: null,
  updatedAt: new Date()
});

// Delete all files in a folder
const folderRef = ref(storage, "images/temporary-files");
const fileList = await listAll(folderRef);

const deletePromises = fileList.items.map((itemRef) => 
  deleteObject(itemRef)
);

await Promise.all(deletePromises);
console.log("All files in folder deleted");

// Safe delete with error handling
async function safeDeleteFile(filePath) {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log("File deleted successfully");
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      console.log("File already deleted");
    } else {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
}

await safeDeleteFile("images/old-file.jpg");
```

**💡 Tips**:
- Always handle "object-not-found" errors gracefully
- Delete Firestore references when deleting files
- Use `Promise.all()` for multiple deletions
- Consider moving files to "trash" folder instead of immediate deletion
- Implement cleanup functions for temporary files

---

## **4. Integrating Firestore + Storage**

### **Linking Files with Documents**

```javascript
// Complete example: Upload image and link to user document
async function uploadUserProfileImage(userId, imageFile) {
  try {
    // 1. Upload to Storage
    const storagePath = `users/${userId}/profile.jpg`;
    const fileRef = ref(storage, storagePath);
    
    const metadata = {
      contentType: imageFile.type,
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    };
    
    await uploadBytes(fileRef, imageFile, metadata);
    
    // 2. Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    // 3. Update Firestore document
    await updateDoc(doc(db, "users", userId), {
      profileImage: downloadURL,
      profileImagePath: storagePath, // Store path for future deletions
      updatedAt: new Date()
    });
    
    console.log("Profile image uploaded and linked successfully");
    return downloadURL;
    
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
}

// Complete example: Delete user and all associated files
async function deleteUser(userId) {
  try {
    // 1. Get user data first
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    
    // 2. Delete profile image from Storage if exists
    if (userData.profileImagePath) {
      await deleteObject(ref(storage, userData.profileImagePath));
    }
    
    // 3. Delete all user's files from Storage
    const userFilesRef = ref(storage, `users/${userId}`);
    const fileList = await listAll(userFilesRef);
    
    const deleteFilePromises = fileList.items.map(item => 
      deleteObject(item)
    );
    
    await Promise.all(deleteFilePromises);
    
    // 4. Delete user document from Firestore
    await deleteDoc(doc(db, "users", userId));
    
    console.log("User and all associated files deleted successfully");
    
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
```

---

## **5. Best Practices & Security**

### **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read, authenticated write for posts
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### **Storage Security Rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read for images
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### **Performance Tips**
- Use pagination with `limit()` for large datasets
- Create composite indexes for complex queries
- Cache download URLs to reduce Storage API calls
- Use batch operations for multiple writes
- Implement offline persistence for better user experience

---

## **6. Mini Project: Social Media App**

### **Post with Image Upload**
```javascript
async function createPost(userId, textContent, imageFile) {
  const db = getFirestore();
  const storage = getStorage();
  
  // 1. Create post document first
  const postRef = doc(collection(db, "posts"));
  const postData = {
    id: postRef.id,
    userId: userId,
    text: textContent,
    imageUrl: null,
    createdAt: new Date(),
    likes: 0
  };
  
  await setDoc(postRef, postData);
  
  // 2. Upload image if provided
  if (imageFile) {
    const imagePath = `posts/${postRef.id}/image.jpg`;
    const imageRef = ref(storage, imagePath);
    
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);
    
    // 3. Update post with image URL
    await updateDoc(postRef, {
      imageUrl: imageUrl,
      imagePath: imagePath
    });
    
    postData.imageUrl = imageUrl;
  }
  
  return postData;
}
```

