# KpSull - Documentation Projet

> Plateforme de connexion entre créateurs de contenu et clients avec authentification sécurisée et système de monétisation.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Stack Technique](#stack-technique)
- [Principes de Développement](#principes-de-développement)
- [Structure du Projet](#structure-du-projet)
- [Conventions de Code](#conventions-de-code)
- [Workflow de Développement](#workflow-de-développement)
- [Tests & Qualité](#tests--qualité)

---

## 🎯 Vue d'ensemble

### Objectif du Projet

KpSull est une plateforme moderne permettant aux créateurs de contenu de :

- Créer leur profil et partager du contenu
- Monétiser leur audience via des abonnements payants
- Interagir avec leurs clients/fans

Et aux clients de :

- Découvrir des créateurs
- Accéder à du contenu exclusif
- S'abonner via différentes formules

### Fonctionnalités Actuelles

✅ **Authentification complète**

- Inscription/Connexion par email/mot de passe
- OAuth Google (configuré)
- JWT tokens sécurisés
- Gestion des sessions

✅ **Gestion des rôles**

- USER : Clients/consommateurs de contenu
- CREATOR : Créateurs de contenu (avec plans payants)
- ADMIN : Administrateurs de la plateforme

✅ **Infrastructure**

- Monorepo Turborepo
- Base de données PostgreSQL
- API REST (NestJS)
- Frontend React/Next.js

### Roadmap

🚧 **À venir**

- Plans d'abonnement créateurs (3 formules)
- Dashboard créateur avancé
- Système de paiement (Stripe)
- Gestion de contenu et médias
- Analytics et statistiques
- Messagerie entre utilisateurs
- Notifications temps réel

---

## 🏗️ Architecture

### Monorepo Turborepo

```
kpsull/
├── apps/
│   ├── frontend/        # Next.js 15 + React 18
│   └── backend/         # NestJS + Prisma
├── packages/
│   ├── eslint-config/   # Configuration ESLint partagée
│   ├── typescript-config/ # Configuration TypeScript partagée
│   ├── ui/              # Composants UI réutilisables
│   └── utils/           # Utilitaires partagés
├── CLAUDE.md            # Ce fichier
├── turbo.json           # Configuration Turborepo
└── package.json         # Scripts monorepo
```

### Architecture Frontend (Next.js)

**App Router Architecture** (Next.js 15)

```
apps/frontend/src/
├── app/                    # App Router
│   ├── (auth)/            # Route group - pages d'auth
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Protected routes
│   ├── api/               # API Routes (BetterAuth)
│   │   └── auth/
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── ui/                # shadcn/ui components
│   └── features/          # Feature-specific components
├── lib/
│   ├── auth.ts            # BetterAuth configuration
│   ├── auth-client.ts     # Client-side auth
│   └── utils.ts           # Utility functions
└── prisma/
    └── schema.prisma      # Prisma schema (synced with backend)
```

### Architecture Backend (NestJS)

**Clean Architecture + Domain-Driven Design**

```
apps/backend/src/
├── modules/               # Feature modules
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── entities/      # Domain entities
│   │   └── __tests__/
│   ├── auth/
│   └── content/
├── common/                # Shared code
│   ├── filters/           # Exception filters
│   ├── guards/            # Auth guards
│   ├── interceptors/
│   ├── pipes/             # Validation pipes
│   └── decorators/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/
├── config/                # Configuration
└── main.ts                # Application entry point
```

### Base de Données (PostgreSQL + Prisma)

**Schéma actuel :**

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?
  name          String?
  image         String?
  role          Role      @default(USER)
  emailVerified Boolean   @default(false)

  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique

  user User @relation(fields: [userId], references: [id])
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  providerId            String    # "google", etc.
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?

  user User @relation(fields: [userId], references: [id])
}

enum Role {
  ADMIN
  CREATOR
  USER
}
```

---

## 💻 Stack Technique

### Frontend

| Technologie       | Version | Usage                    |
| ----------------- | ------- | ------------------------ |
| **Next.js**       | 15.5.5  | Framework React avec SSR |
| **React**         | 18.3.1  | Library UI               |
| **TypeScript**    | 5.x     | Typage statique          |
| **Tailwind CSS**  | 4.x     | Styling utility-first    |
| **shadcn/ui**     | latest  | Composants UI            |
| **BetterAuth**    | 1.3.27  | Authentification         |
| **Prisma Client** | 6.17.1  | ORM client               |
| **Lucide React**  | latest  | Icônes                   |

### Backend

| Technologie    | Version | Usage                 |
| -------------- | ------- | --------------------- |
| **NestJS**     | 10.x    | Framework Node.js     |
| **Prisma**     | 6.8.2   | ORM                   |
| **PostgreSQL** | 16+     | Base de données       |
| **BetterAuth** | 1.3.27  | Authentification      |
| **bcryptjs**   | 3.x     | Hashing mots de passe |
| **Jest**       | 29.x    | Tests unitaires       |

### DevOps & Outils

- **Turborepo** : Build system monorepo
- **ESLint** : Linting JavaScript/TypeScript
- **Prettier** : Formatage de code
- **Husky** : Git hooks
- **SonarQube** : Analyse qualité code
- **GitHub Actions** : CI/CD

---

## 🎓 Principes de Développement

### SOLID Principles

#### 1. **S**ingle Responsibility Principle (SRP)

**Principe** : Une classe ne doit avoir qu'une seule raison de changer.

**Application dans le projet :**

```typescript
// ❌ MAUVAIS : Classe qui fait trop de choses
class UserManager {
  createUser(data) {
    /* ... */
  }
  sendEmail(user) {
    /* ... */
  }
  validateUser(user) {
    /* ... */
  }
  saveToDatabase(user) {
    /* ... */
  }
}

// ✅ BON : Séparation des responsabilités
class UserService {
  createUser(data) {
    /* Logique métier */
  }
}

class EmailService {
  sendWelcomeEmail(user) {
    /* Envoi email */
  }
}

class UserValidator {
  validate(user) {
    /* Validation */
  }
}

class UserRepository {
  save(user) {
    /* Persistance */
  }
}
```

#### 2. **O**pen/Closed Principle (OCP)

**Principe** : Ouvert à l'extension, fermé à la modification.

```typescript
// ✅ BON : Utilisation de l'injection de dépendances
interface IAuthProvider {
  authenticate(credentials: any): Promise<User>
}

class GoogleAuthProvider implements IAuthProvider {
  async authenticate(token: string) {
    /* ... */
  }
}

class EmailAuthProvider implements IAuthProvider {
  async authenticate(credentials: EmailCredentials) {
    /* ... */
  }
}

class AuthService {
  constructor(private providers: IAuthProvider[]) {}

  async authenticate(provider: string, credentials: any) {
    const authProvider = this.providers.find((p) => p.name === provider)
    return authProvider.authenticate(credentials)
  }
}
```

#### 3. **L**iskov Substitution Principle (LSP)

**Principe** : Les objets d'une classe dérivée doivent pouvoir remplacer les objets de la classe de base.

```typescript
// ✅ BON : Toutes les implémentations respectent le contrat
abstract class BaseRepository<T> {
  abstract findAll(): Promise<T[]>
  abstract findById(id: string): Promise<T | null>
  abstract save(entity: T): Promise<T>
}

class UserRepository extends BaseRepository<User> {
  async findAll() {
    /* ... */
  }
  async findById(id: string) {
    /* ... */
  }
  async save(user: User) {
    /* ... */
  }
}

class ContentRepository extends BaseRepository<Content> {
  async findAll() {
    /* ... */
  }
  async findById(id: string) {
    /* ... */
  }
  async save(content: Content) {
    /* ... */
  }
}
```

#### 4. **I**nterface Segregation Principle (ISP)

**Principe** : Ne pas forcer les clients à dépendre d'interfaces qu'ils n'utilisent pas.

```typescript
// ❌ MAUVAIS : Interface trop large
interface IUser {
  login(): void
  logout(): void
  createContent(): void
  manageSubscriptions(): void
  moderateUsers(): void
}

// ✅ BON : Interfaces ségrégées
interface IAuthenticatable {
  login(): void
  logout(): void
}

interface IContentCreator {
  createContent(): void
  manageSubscriptions(): void
}

interface IModerator {
  moderateUsers(): void
}

class RegularUser implements IAuthenticatable {
  /* ... */
}
class Creator implements IAuthenticatable, IContentCreator {
  /* ... */
}
class Admin implements IAuthenticatable, IModerator {
  /* ... */
}
```

#### 5. **D**ependency Inversion Principle (DIP)

**Principe** : Dépendre des abstractions, pas des implémentations.

```typescript
// ✅ BON : Injection de dépendances avec abstractions
interface IDatabase {
  query(sql: string): Promise<any>
}

interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>
}

@Injectable()
class UserService {
  constructor(
    @Inject('IDatabase') private db: IDatabase,
    @Inject('IEmailService') private emailService: IEmailService
  ) {}

  async createUser(data: CreateUserDto) {
    const user = await this.db.query(/* ... */)
    await this.emailService.send(user.email, 'Welcome', '...')
    return user
  }
}
```

### Clean Code Principles

#### Nommage Explicite

```typescript
// ❌ MAUVAIS
const d = new Date()
const u = await getUserById(id)
function calc(a, b) {
  return a * b * 0.2
}

// ✅ BON
const currentDate = new Date()
const authenticatedUser = await getUserById(userId)
function calculateVAT(price: number, quantity: number): number {
  const VAT_RATE = 0.2
  return price * quantity * VAT_RATE
}
```

#### Fonctions Courtes et Focused

```typescript
// ❌ MAUVAIS : Fonction qui fait trop de choses
async function handleUserRegistration(data) {
  // Validation
  if (!data.email) throw new Error('Email required')
  if (!data.password) throw new Error('Password required')
  if (data.password.length < 8) throw new Error('Password too short')

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(data.password, salt)

  // Save user
  const user = await db.user.create({
    data: { ...data, password: hashedPassword },
  })

  // Send email
  await sendEmail(user.email, 'Welcome', 'Thanks for signing up')

  // Log
  console.log('User registered:', user.id)

  return user
}

// ✅ BON : Séparation en fonctions dédiées
async function registerUser(data: RegisterDto): Promise<User> {
  validateRegistrationData(data)
  const hashedPassword = await hashPassword(data.password)
  const user = await createUser({ ...data, password: hashedPassword })
  await sendWelcomeEmail(user)
  logUserRegistration(user)
  return user
}
```

### Test-Driven Development (TDD)

#### Cycle Red-Green-Refactor

1. **RED** : Écrire un test qui échoue
2. **GREEN** : Écrire le code minimum pour faire passer le test
3. **REFACTOR** : Améliorer le code en gardant les tests verts

**Exemple :**

```typescript
// 1. RED - Écrire le test d'abord
describe('UserService', () => {
  it('should create a user with hashed password', async () => {
    const userData = { email: 'test@example.com', password: 'password123' }
    const user = await userService.createUser(userData)

    expect(user.email).toBe(userData.email)
    expect(user.password).not.toBe(userData.password) // Password doit être hashé
    expect(await bcrypt.compare(userData.password, user.password)).toBe(true)
  })
})

// 2. GREEN - Implémenter le code minimum
class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    return this.userRepository.save({
      ...data,
      password: hashedPassword,
    })
  }
}

// 3. REFACTOR - Améliorer sans casser les tests
class UserService {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordHasher.hash(data.password)
    return this.userRepository.save({
      ...data,
      password: hashedPassword,
    })
  }
}
```

#### Types de Tests

1. **Tests Unitaires** : Tester une fonction/classe isolée
2. **Tests d'Intégration** : Tester plusieurs composants ensemble
3. **Tests E2E** : Tester le parcours utilisateur complet

```typescript
// Test Unitaire
describe('calculateDiscount', () => {
  it('should apply 10% discount for premium users', () => {
    expect(calculateDiscount(100, 'premium')).toBe(90)
  })
})

// Test d'Intégration
describe('UserService Integration', () => {
  it('should create user and send welcome email', async () => {
    const user = await userService.createUser(userData)
    expect(emailService.send).toHaveBeenCalledWith(user.email, 'Welcome', expect.any(String))
  })
})

// Test E2E
describe('User Registration Flow', () => {
  it('should allow user to register and login', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'Pass123!' })
      .expect(201)

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'Pass123!' })
      .expect(200)

    expect(loginRes.body).toHaveProperty('accessToken')
  })
})
```

---

## 📁 Structure du Projet

### Frontend (`apps/frontend`)

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                      # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── label.tsx
│   └── features/                # Feature-specific components
│       ├── auth/
│       └── dashboard/
│
├── lib/
│   ├── auth.ts                  # BetterAuth server config
│   ├── auth-client.ts           # BetterAuth client
│   └── utils.ts                 # Utility functions (cn, etc.)
│
├── prisma/
│   └── schema.prisma            # Synced with backend
│
└── __tests__/                   # Tests Vitest
    ├── components/
    ├── lib/
    └── integration/
```

### Backend (`apps/backend`)

```
src/
├── modules/
│   ├── users/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── __tests__/
│   │   │   ├── users.service.spec.ts
│   │   │   └── users.controller.spec.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── users.module.ts
│   │
│   ├── auth/
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── ...
│   │
│   └── content/
│       └── ...
│
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── decorators/
│       └── current-user.decorator.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── config/
│   ├── database.config.ts
│   └── app.config.ts
│
└── main.ts
```

---

## 📝 Conventions de Code

### TypeScript

#### Nommage

```typescript
// Classes : PascalCase
class UserService {}
class CreateUserDto {}

// Interfaces : PascalCase avec préfixe I (optionnel)
interface IUserRepository {}
interface User {}

// Types : PascalCase
type AuthProvider = 'google' | 'email'

// Variables & Fonctions : camelCase
const currentUser = {}
function calculateTotal() {}

// Constantes : UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.kpsull.com'

// Fichiers : kebab-case
user - service.ts
create - user.dto.ts
```

#### Imports

```typescript
// 1. Imports externes (node_modules)
import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

// 2. Imports internes (alias @/)
import { UserDto } from '@/modules/users/dto'
import { DatabaseService } from '@/common/database'

// 3. Imports relatifs
import { UserEntity } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
```

#### Types vs Interfaces

```typescript
// Interfaces : pour les objets et classes
interface User {
  id: string
  email: string
}

// Types : pour les unions, intersections, utilitaires
type Role = 'user' | 'creator' | 'admin'
type Nullable<T> = T | null
type UserWithRole = User & { role: Role }
```

### React/Next.js

#### Composants

```typescript
// Composant fonctionnel avec typage
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', onClick, children }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Composant serveur Next.js (par défaut)
export default function HomePage() {
  return <div>Home</div>;
}

// Composant client
'use client';

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### Hooks

```typescript
// Hook personnalisé
function useAuth() {
  const { data: session, isPending } = useSession();

  return {
    user: session?.user,
    isLoading: isPending,
    isAuthenticated: !!session,
  };
}

// Utilisation
function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return <div>Welcome {user.name}</div>;
}
```

### NestJS

#### Controllers

```typescript
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll()
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id)
  }
}
```

#### Services

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    // Validation métier
    await this.validateEmail(data.email)

    // Hash password
    const hashedPassword = await this.hashPassword(data.password)

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    })

    // Actions post-création
    await this.emailService.sendWelcomeEmail(user)

    return user
  }

  private async validateEmail(email: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) {
      throw new ConflictException('Email already exists')
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}
```

---

## 🔄 Workflow de Développement

### Workflow Git

#### Branches

```
main                  # Production-ready code
├── develop          # Development branch
    ├── feature/auth-google      # Nouvelle fonctionnalité
    ├── feature/dashboard-ui     # Nouvelle fonctionnalité
    ├── fix/login-bug            # Correction de bug
    └── refactor/user-service    # Refactoring
```

#### Commits Conventionnels

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     # Nouvelle fonctionnalité
fix:      # Correction de bug
docs:     # Documentation
style:    # Formatage, point-virgule, etc.
refactor: # Refactoring (ni feat ni fix)
test:     # Ajout de tests
chore:    # Tâches de maintenance

# Exemples
feat(auth): add Google OAuth integration
fix(dashboard): resolve user data loading issue
docs(readme): update installation instructions
refactor(user-service): apply SOLID principles
test(auth): add unit tests for login flow
chore(deps): update dependencies
```

#### Pull Request Process

1. **Créer une branche** depuis `develop`

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **Développer** en respectant le TDD
   - Écrire les tests d'abord
   - Implémenter le code
   - Refactorer

3. **Commits réguliers** avec messages conventionnels

   ```bash
   git add .
   git commit -m "feat(users): add user profile page"
   ```

4. **Vérifications avant push**

   ```bash
   npm run lint          # Vérifier le code
   npm run test          # Tests
   npm run build         # Build successful
   ```

5. **Push et créer PR**

   ```bash
   git push origin feature/new-feature
   # Créer la PR sur GitHub
   ```

6. **Code Review**
   - Au moins 1 approbation requise
   - Tous les checks CI doivent passer
   - Pas de conflits avec develop

7. **Merge** vers `develop`
   - Squash commits si nécessaire
   - Supprimer la branche après merge

### Développement Local

#### Premier Setup

```bash
# 1. Cloner le repo
git clone https://github.com/votre-org/kpsull.git
cd kpsull

# 2. Installer les dépendances
npm install

# 3. Configuration environnement
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env

# Éditer les fichiers .env avec vos valeurs

# 4. Setup base de données
cd apps/backend
npx prisma migrate dev
npx prisma generate

# 5. Lancer en dev
cd ../..
npm run dev
```

#### Commandes Quotidiennes

```bash
# Développement
npm run dev                 # Lance tous les apps en dev
npm run dev --filter=frontend   # Seulement frontend
npm run dev --filter=backend    # Seulement backend

# Tests
npm run test               # Tous les tests
npm run test:watch         # Tests en mode watch
npm run test:coverage      # Rapport de couverture

# Qualité
npm run lint               # Linter tout le monorepo
npm run lint:fix           # Fix auto
npm run type-check         # Vérification TypeScript
npm run format             # Formater avec Prettier

# Build
npm run build              # Build tous les apps
npm run build --filter=frontend  # Build frontend seulement

# Base de données
cd apps/backend
npx prisma studio          # GUI pour la DB
npx prisma migrate dev     # Créer migration
npx prisma generate        # Générer client
```

---

## 🧪 Tests & Qualité

### Configuration Tests

#### Frontend (Vitest)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', '**/*.config.*', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### Backend (Jest)

Configuration déjà présente dans `apps/backend/package.json`.

### Écrire des Tests

#### Test Unitaire (Backend)

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const userData = { email: 'test@test.com', password: 'password123' }
      const mockUser = { id: '1', ...userData, password: 'hashed' }

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser)

      const result = await service.create(userData)

      expect(result.password).not.toBe(userData.password)
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should throw error if email already exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({} as any)

      await expect(
        service.create({ email: 'existing@test.com', password: 'pass' })
      ).rejects.toThrow()
    })
  })
})
```

#### Test Composant (Frontend)

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    render(<Button variant="secondary">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');
  });
});
```

### Couverture de Code

**Objectifs :**

- Couverture globale : **80%**
- Couverture des branches : **75%**
- Couverture des fonctions : **85%**

```bash
# Générer rapport de couverture
npm run test:coverage

# Visualiser le rapport
open coverage/lcov-report/index.html
```

### SonarQube

**Métriques surveillées :**

- **Bugs** : 0 tolérance
- **Vulnérabilités** : 0 tolérance
- **Code Smells** : < 50
- **Coverage** : > 80%
- **Duplication** : < 3%
- **Maintainability Rating** : A ou B

```bash
# Analyse locale
npm run sonar:scan

# Voir les résultats
open http://localhost:9000
```

---

## 🚀 Déploiement

### Production Checklist

- [ ] Tous les tests passent
- [ ] Coverage > 80%
- [ ] Pas de vulnérabilités critiques
- [ ] Build réussit sans warnings
- [ ] Variables d'environnement configurées
- [ ] Migrations DB appliquées
- [ ] Monitoring configuré
- [ ] Backups DB activés

### Scripts de Déploiement

```bash
# Build production
npm run build

# Test en environnement de production
npm run start:prod

# Deploy (selon votre plateforme)
# Vercel, Railway, AWS, etc.
```

---

## 📚 Ressources

### Documentation Externe

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BetterAuth Documentation](https://www.better-auth.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Articles & Guides

- [SOLID Principles in TypeScript](https://blog.bitsrc.io/solid-principles-in-typescript)
- [Clean Architecture in NestJS](https://medium.com/@sergiohc_dev/clean-architecture-in-nest-js)
- [Test-Driven Development Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## 👥 Contribution

Pour contribuer au projet, veuillez :

1. Lire ce document en entier
2. Respecter les conventions de code
3. Écrire des tests pour toute nouvelle fonctionnalité
4. Suivre le workflow Git
5. Créer une PR avec une description claire

---

## 📄 License

Propriétaire - Tous droits réservés

---

**Dernière mise à jour** : 16 Octobre 2025
**Version** : 1.0.0
