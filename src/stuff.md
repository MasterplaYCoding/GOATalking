playwright: 

npm run test:e2e

npx playwright test tests/authentication.spec.ts
npx playwright test tests/poll-management.spec.ts
npx playwright test tests/marginality-flow.spec.ts

npx playwright test --headed --workers=1


unit tests:

npm run test
npm run coverage

cookies:
dev tools