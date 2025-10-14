This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Weekly Plan Generation (Hexagonal Architecture)

This project uses Ports & Adapters for weekly plan generation.

- Domain port: `src/domain/ports/PlanRepository.ts` with `saveWeekPlan(userId, week, plan)`
- Infra adapters:
  - Firestore: `src/infra/plans/FirestorePlanRepository.ts` writes to `users/{userId}/plans/week_{n}` and sets `updatedAt`.
  - DynamoDB: `src/infra/plans/DynamoPlanRepository.ts` writes items with keys `pk = USER#{userId}`, `sk = WEEK#{week}` and `updatedAt`. Uses a conditional expression for idempotency.
- Application service: `src/application/GenerateWeeklyPlans.ts` orchestrates week loops, calls the pure domain generator, and persists via repository.
- Transport (Next.js API routes): `src/app/api/plans/route.ts` and `src/app/api/generatePlan/route.ts` are thin: auth, parse/validate, call service, return DTO.

Runtime and env selection is done via `src/lib/planRepoFactory.ts`:
- If `DDB_TABLE` is set, DynamoDB adapter is used.
- Else if `NEXT_PUBLIC_FIREBASE_API_KEY` is set, Firestore adapter is used.
- Else an error is thrown.

Both routes export `runtime = "nodejs"` to support AWS SDK v3.

### Environment Variables

Pick one persistence backend:

- DynamoDB (server-only):
  - `DDB_TABLE`: DynamoDB table name
  - Standard AWS credentials via default provider chain (e.g. `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or IAM role when deployed)

- Firestore (client/server via Firebase SDK):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

Authentication (Cognito):
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `AWS_REGION`

### API

POST `api/plans` or `api/generatePlan`

Body:

```
{
  "user": { ... },
  "weeks": 1,            // optional (1–12)
  "startWeek": 1         // optional (>=1)
}
```

Responses:
- 200: `{ success: true, allPlans: [{ week, plan }] }`
- 400: invalid JSON or body
- 401: unauthorized
- 500: generic error (no infra details)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
