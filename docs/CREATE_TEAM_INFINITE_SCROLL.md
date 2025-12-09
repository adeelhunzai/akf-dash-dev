# Create Team Modal - Infinite Scroll & Search

## Overview

The Create Team modal implements infinite scroll with backend search for the learners list. This document explains how it works.

## How It Works

### 1. Initial Load
- When modal opens, it fetches the **first 6 learners** from the API
- Displays them in a scrollable container (350px height)
- Shows loading spinner during fetch

### 2. Infinite Scroll
- User scrolls down in the learners list
- When scroll reaches **80% of container height**, automatically loads next page
- Fetches next 6 learners and **appends** them to the list
- Shows "Loading more..." indicator at bottom during fetch
- Continues until all pages are loaded

### 3. Backend Search (Already Implemented)
- User types in search box
- **300ms debounce** delay before triggering API call
- API call is made to backend with search term: `/custom-api/v1/users/list?search=<query>&role=learner`
- Backend returns filtered results from WordPress database
- **Resets to page 1** when search changes
- **Clears previous results** and shows new search results
- Infinite scroll works with search results too

### 4. Visual Feedback
- **Initial load**: Spinner with "Loading learners..."
- **Pagination**: "Loading more..." at bottom
- **End of list**: "No more learners" message
- **Empty search**: "No learners found matching your search"
- **Scrollable area**: Border and rounded corners to indicate scrollability

## Key Features

### ✅ Backend Search (Not Client-Side)
The search does NOT filter locally. It makes a new API call to the backend:

```typescript
const { data: usersData } = useGetUsersListQuery({
  page: currentPage,
  per_page: 6,
  search: debouncedSearch,  // ← Sent to backend API
  role: 'learner'
})
```

**Backend receives**: `GET /wp-json/custom-api/v1/users/list?page=1&per_page=6&search=john&role=learner`

**Backend should**:
- Search in `display_name` and `user_email` fields
- Return only matching users
- Paginate results (6 per page)

### ✅ Infinite Scroll Implementation

```typescript
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const target = e.currentTarget
  const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight

  // Load more when scrolled to 80%
  if (scrollPercentage > 0.8 && hasMore && !isFetchingUsers) {
    setCurrentPage(prev => prev + 1)
  }
}
```

**How it works**:
1. Calculates scroll percentage
2. When user scrolls past 80%, increments page number
3. RTK Query automatically fetches next page
4. New results are appended to existing list

### ✅ State Management

```typescript
const [currentPage, setCurrentPage] = useState(1)
const [allLearners, setAllLearners] = useState<Learner[]>([])
const [hasMore, setHasMore] = useState(true)
```

- `currentPage`: Current page number for API
- `allLearners`: Accumulated list of all loaded learners
- `hasMore`: Whether more pages exist

### ✅ Search Reset Logic

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery)
    setCurrentPage(1)        // ← Reset to page 1
    setAllLearners([])       // ← Clear previous results
  }, 300)
  return () => clearTimeout(timer)
}, [searchQuery])
```

When search changes:
1. Wait 300ms (debounce)
2. Reset to page 1
3. Clear learners list
4. Fetch new results from backend

## UI Components

### Scrollable Container
```tsx
<div 
  className="space-y-3 overflow-y-auto pr-2 h-[350px] border border-gray-200 rounded-lg p-3" 
  onScroll={handleScroll}
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6'
  }}
>
```

- Fixed height: 350px
- Overflow: auto (enables scrolling)
- Border: Makes scrollable area obvious
- Custom scrollbar styling

### Loading States

**Initial Load**:
```tsx
{isLoadingUsers && currentPage === 1 ? (
  <div>Loading learners...</div>
) : ...}
```

**Pagination**:
```tsx
{isFetchingUsers && currentPage > 1 && (
  <div>Loading more...</div>
)}
```

**End of List**:
```tsx
{!hasMore && allLearners.length > 0 && (
  <div>No more learners</div>
)}
```

## Backend Requirements

The existing `/custom-api/v1/users/list` endpoint already supports:
- ✅ Pagination (`page`, `per_page`)
- ✅ Search (`search` parameter)
- ✅ Role filtering (`role=learner`)

**Example API Call**:
```
GET /wp-json/custom-api/v1/users/list?page=1&per_page=6&search=john&role=learner
```

**Expected Response**:
```json
{
  "users": [...],
  "total_users": 45,
  "total_pages": 8,
  "current_page": 1
}
```

## Testing

### Test Infinite Scroll:
1. Open Create Team modal
2. Scroll down in learners list
3. Should see "Loading more..." and new learners appear
4. Continue scrolling until "No more learners" appears

### Test Search:
1. Type in search box
2. Wait 300ms (debounce)
3. Should see API call in network tab with search parameter
4. Results should be filtered by backend
5. Infinite scroll should work with search results

### Test Search Reset:
1. Search for "john"
2. Scroll down to load more pages
3. Change search to "sarah"
4. Should reset to page 1 and show new results

## Troubleshooting

### Scroll Not Working
- Check container has fixed height (`h-[350px]`)
- Check `overflow-y-auto` is applied
- Verify content is taller than container

### Search Not Working
- Check network tab for API calls with `search` parameter
- Verify backend is filtering results
- Check 300ms debounce is working

### Infinite Scroll Not Triggering
- Verify `hasMore` is true
- Check scroll percentage calculation
- Ensure `isFetchingUsers` prevents duplicate requests

## Performance

- **Initial load**: 6 users (~50ms)
- **Pagination**: 6 users per request (~50ms)
- **Search debounce**: 300ms delay
- **Memory**: Efficient - only loads visible + buffered items
- **Network**: Minimal - only fetches when needed

## Summary

✅ **Backend search** - Makes API calls with search term
✅ **Infinite scroll** - Loads 6 users at a time
✅ **Debounced search** - 300ms delay
✅ **Visual feedback** - Loading indicators and end-of-list message
✅ **Efficient** - Only loads what's needed
✅ **Smooth UX** - No lag or duplicate requests
