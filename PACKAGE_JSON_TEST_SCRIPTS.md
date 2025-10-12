# Package.json Test Scripts - Updated

## ✅ Changes Made

Updated `package.json` with separate test scripts for unit and integration tests.

## New Test Scripts

### Available Commands

```bash
# Default - Run unit tests only (FAST)
npm test
npm run test:unit

# Run integration tests (requires credentials)
npm run test:integration

# Run ALL tests (unit + integration)
npm run test:all

# Watch modes
npm run watch-test                 # Watch unit tests
npm run watch-test:integration     # Watch integration tests
```

## Script Definitions

### `npm test` (Default)
```json
"test": "node --experimental-vm-modules node_modules/.bin/jest --forceExit --coverage --collectCoverage --coverageDirectory=\"./coverage\" --ci --reporters=default --reporters=jest-junit --watchAll=false --testPathIgnorePatterns=\"/integration/\""
```

**Purpose**: Run unit tests only (default behavior)  
**Excludes**: `/integration/` directory  
**Coverage**: Yes  
**Speed**: ~2-3 seconds  
**Credentials**: Not required

### `npm run test:unit`
```json
"test:unit": "node --experimental-vm-modules node_modules/.bin/jest --forceExit --coverage --collectCoverage --coverageDirectory=\"./coverage\" --ci --reporters=default --reporters=jest-junit --watchAll=false --testPathIgnorePatterns=\"/integration/\""
```

**Purpose**: Explicitly run unit tests (same as `npm test`)  
**Excludes**: `/integration/` directory  
**Coverage**: Yes  
**Speed**: ~2-3 seconds  
**Credentials**: Not required

### `npm run test:integration`
```json
"test:integration": "node --experimental-vm-modules node_modules/.bin/jest --forceExit --testPathPattern=\"/integration/\" --watchAll=false --testTimeout=120000"
```

**Purpose**: Run integration tests only  
**Includes**: Only `/integration/` directory  
**Coverage**: No (faster execution)  
**Speed**: ~30-300 seconds (depends on network)  
**Credentials**: Required  
**Timeout**: 120 seconds (2 minutes) per test

### `npm run test:all`
```json
"test:all": "node --experimental-vm-modules node_modules/.bin/jest --forceExit --coverage --collectCoverage --coverageDirectory=\"./coverage\" --ci --reporters=default --reporters=jest-junit --watchAll=false"
```

**Purpose**: Run ALL tests (unit + integration)  
**Includes**: Everything  
**Coverage**: Yes  
**Speed**: ~30-300 seconds  
**Credentials**: Required for integration tests

### `npm run watch-test`
```json
"watch-test": "npm run test:unit -- --watchAll"
```

**Purpose**: Watch mode for unit tests during development  
**Interactive**: Yes  
**Speed**: Fast re-runs  
**Credentials**: Not required

### `npm run watch-test:integration`
```json
"watch-test:integration": "npm run test:integration -- --watchAll"
```

**Purpose**: Watch mode for integration tests  
**Interactive**: Yes  
**Speed**: Slower re-runs  
**Credentials**: Required

## Usage Examples

### Development Workflow

```bash
# Start watch mode for TDD
npm run watch-test

# Make changes, tests auto-run
# Press 'p' to filter by filename
# Press 't' to filter by test name
# Press 'a' to run all tests
```

### CI/CD Pipeline

```yaml
# .gitlab-ci.yml or similar

stages:
  - build
  - test
  - integration-test

build:
  stage: build
  script:
    - npm install
    - npm run buildts

unit-tests:
  stage: test
  script:
    - npm test              # Only unit tests
  # Runs on every commit

integration-tests:
  stage: integration-test
  script:
    - npm run test:integration
  only:
    - main                  # Only on main branch
  when: manual              # Or manual trigger
```

### Pre-Commit Hook

```json
// package.json - husky or lint-staged
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"  // Fast unit tests only
    }
  }
}
```

## What Each Script Does

### `npm test` (Recommended Default)

**Runs:**
- ✅ All files in `test/unit/`
- ❌ Excludes `test/integration/`

**Best for:**
- Local development
- Pre-commit checks
- CI/CD fast feedback
- Every commit

**Output:**
```
Test Suites: 14 passed
Tests:       180 passed
Time:        ~2.4s
Coverage:    10.56%
```

### `npm run test:integration`

**Runs:**
- ✅ All files in `test/integration/`
- ❌ Excludes `test/unit/`

**Best for:**
- Release validation
- Nightly builds
- Main branch merges
- Manual verification

**Requirements:**
```bash
# Configure credentials first
snc configure profile set --profile your-instance
```

**Output:**
```
Test Suites: X passed
Tests:       Y passed
Time:        ~30-300s (depends on tests)
```

### `npm run test:all`

**Runs:**
- ✅ Everything (`test/unit/` + `test/integration/`)

**Best for:**
- Full validation before release
- Complete test suite execution
- Comprehensive coverage reports

**Requirements:**
- ServiceNow credentials configured

## Test Execution Time Comparison

| Command | Tests Run | Time | Credentials |
|---------|-----------|------|-------------|
| `npm test` | ~180 | ~2.4s | ❌ Not needed |
| `npm run test:integration` | ~25 | ~30-300s | ✅ Required |
| `npm run test:all` | ~205 | ~35-305s | ✅ Required |

## Key Changes from Before

### Before
```json
"test": "jest ..."  // Ran ALL tests (slow)
```
- ❌ Ran both unit and integration tests
- ❌ Required credentials
- ❌ Slow (~30-60s)
- ❌ Not suitable for every commit

### After
```json
"test": "jest ... --testPathIgnorePatterns=\"/integration/\""
"test:integration": "jest ... --testPathPattern=\"/integration/\""
"test:all": "jest ..."  // Runs everything
```
- ✅ Default is fast unit tests
- ✅ No credentials for default
- ✅ Fast (~2.4s)
- ✅ Perfect for every commit
- ✅ Integration tests available separately

## Migrating Existing Workflows

### If you had:
```bash
npm test
```

### Now you should:
```bash
# For local development (fast feedback)
npm test  # Still works, but now faster!

# For integration validation  
npm run test:integration

# For complete validation
npm run test:all
```

## Integration with Other Tools

### VSCode
```json
// .vscode/settings.json
{
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": "watch"
}
```

### GitHub Actions
```yaml
- name: Run tests
  run: npm test  # Fast unit tests
  
- name: Run integration tests
  run: npm run test:integration
  if: github.ref == 'refs/heads/main'
```

### GitLab CI
```yaml
test:unit:
  script:
    - npm test

test:integration:
  script:
    - npm run test:integration
  only:
    - main
  when: manual
```

## Tips

1. **Use `npm test` by default** - It's fast and doesn't need credentials
2. **Run integration tests before releases** - Validate real behavior
3. **Use watch mode during development** - `npm run watch-test`
4. **Run `test:all` before major releases** - Complete validation

## Environment Variables

Integration tests may use:
```bash
export SERVICENOW_INSTANCE=your-instance
export SERVICENOW_USERNAME=your-username
export SERVICENOW_PASSWORD=your-password
```

Or use ServiceNow CLI:
```bash
snc configure profile set
```

---

**Quick Start**: Just run `npm test` - it's fast and requires no setup! 🚀

