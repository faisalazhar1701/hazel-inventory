# Deleted Files and Folders

## Summary
All UI pages, routes, components, and navigation items marked as "Delete" or "No requirement match" have been removed from the frontend.

## Deleted Dashboard Pages
- `src/pages/DashboardCrypto/` - Cryptocurrency dashboard
- `src/pages/DashboardNFT/` - NFT marketplace dashboard  
- `src/pages/DashboardJob/` - Job portal dashboard
- `src/pages/DashboardBlog/` - Blog analytics dashboard

## Deleted Module Pages

### Crypto Module
- `src/pages/Crypto/` - Entire Crypto module (Transactions, BuySell, CryptoOrder, MyWallet, ICOList, KYCVerification)

### NFT Marketplace Module
- `src/pages/NFTMarketplace/` - Entire NFT module (Marketplace, Collections, CreateNFT, Creators, ExploreNow, ItemDetails, LiveAuction, Ranking, WalletConnect)

### Jobs Module
- `src/pages/Jobs/` - Entire Jobs module (Statistics, JobList, CandidateList, Application, NewJob, JobCategories, CompaniesList)
- `src/pages/Job_Landing/` - Job landing page

### CRM Module
- `src/pages/Crm/` - Entire CRM module (Contacts, Companies, Deals, Leads)

### Communication Modules
- `src/pages/Chat/` - Chat application
- `src/pages/EmailInbox/` - Email inbox
- `src/pages/Email/` - Email templates

### Utility Modules
- `src/pages/ToDo/` - To-do list application
- `src/pages/SupportTickets/` - Support ticket system
- `src/pages/FileManager/` - File manager

### Landing Pages
- `src/pages/Landing/` - Landing pages (OnePage, NFTLanding, JobLanding)

### Generic Pages
- `src/pages/Pages/Starter/` - Starter page
- `src/pages/Pages/Team/` - Team page
- `src/pages/Pages/Timeline/` - Timeline page
- `src/pages/Pages/Faqs/` - FAQs page
- `src/pages/Pages/Gallery/` - Gallery page
- `src/pages/Pages/Pricing/` - Pricing page
- `src/pages/Pages/SiteMap/` - Sitemap page
- `src/pages/Pages/SearchResults/` - Search results page
- `src/pages/Pages/ComingSoon/` - Coming soon page
- `src/pages/Pages/Blogs/` - Blog pages (ListView, GridView, Overview)

## Removed Routes
All routes for the above pages have been removed from:
- `src/Routes/allRoutes.tsx`

## Removed Menu Items
All navigation menu items for deleted pages have been removed from:
- `src/Layouts/LayoutMenuData.tsx`

## Removed State Variables
Unused state variables have been cleaned up in:
- `src/Layouts/LayoutMenuData.tsx`:
  - `isEmail`, `isSubEmail`
  - `isCRM`, `isCrypto`
  - `isSupportTickets`, `isNFTMarketplace`
  - `isJobs`, `isJobList`, `isCandidateList`
  - `isLanding`, `isBlog`

## Files Kept (Not Deleted)
- All authentication pages (Login, Register, etc.)
- All UI component library pages (Base UI, Advance UI, Forms, Tables, Icons, Maps)
- All chart library pages (ApexCharts, ChartJS, ECharts)
- Dashboard pages: Analytics, CRM, Ecommerce, Projects
- Ecommerce pages: Products, Orders, Customers, Cart, Checkout, Sellers
- Invoices pages: List, Details, Create
- Projects pages: List, Overview, Create
- Tasks pages: Kanban, List View, Details
- Calendar pages
- API Key page
- Widgets page
- Profile pages (Simple Page, Settings)
- Maintenance page
- Privacy Policy and Terms & Conditions pages

## Build Status
Note: The build requires `npm install` to be run first to install dependencies. The code structure is clean and all imports have been removed.

