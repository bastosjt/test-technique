-- CreateEnum
CREATE TYPE "DemiJournee" AS ENUM ('MATIN', 'APRES_MIDI');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COLLABORATEUR', 'MANAGER', 'ADMINISTRATEUR');

-- CreateTable
CREATE TABLE "Domaine" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Domaine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "regionId" INTEGER NOT NULL,
    "domaineId" INTEGER NOT NULL,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaborateur" (
    "id" SERIAL NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLLABORATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateEntree" TIMESTAMP(3) NOT NULL,
    "dateSortie" TIMESTAMP(3),
    "regionId" INTEGER NOT NULL,
    "equipeId" INTEGER,

    CONSTRAINT "Collaborateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motif" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,

    CONSTRAINT "Motif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planning" (
    "id" SERIAL NOT NULL,
    "collaborateurId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "demiJournee" "DemiJournee" NOT NULL,
    "motifId" INTEGER,

    CONSTRAINT "Planning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourFerie" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "libelle" TEXT NOT NULL,
    "estPont" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JourFerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifHistorique" (
    "id" SERIAL NOT NULL,
    "planningId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "ancienMotifId" INTEGER,
    "nouveauMotifId" INTEGER,
    "dateModif" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModifHistorique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JourFerieToRegion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JourFerieToRegion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domaine_nom_key" ON "Domaine"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborateur_matricule_key" ON "Collaborateur"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborateur_email_key" ON "Collaborateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Region_nom_key" ON "Region"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Motif_code_key" ON "Motif"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Planning_collaborateurId_date_demiJournee_key" ON "Planning"("collaborateurId", "date", "demiJournee");

-- CreateIndex
CREATE INDEX "_JourFerieToRegion_B_index" ON "_JourFerieToRegion"("B");

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "Domaine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborateur" ADD CONSTRAINT "Collaborateur_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborateur" ADD CONSTRAINT "Collaborateur_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_collaborateurId_fkey" FOREIGN KEY ("collaborateurId") REFERENCES "Collaborateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_motifId_fkey" FOREIGN KEY ("motifId") REFERENCES "Motif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifHistorique" ADD CONSTRAINT "ModifHistorique_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "Planning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifHistorique" ADD CONSTRAINT "ModifHistorique_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Collaborateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JourFerieToRegion" ADD CONSTRAINT "_JourFerieToRegion_A_fkey" FOREIGN KEY ("A") REFERENCES "JourFerie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JourFerieToRegion" ADD CONSTRAINT "_JourFerieToRegion_B_fkey" FOREIGN KEY ("B") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
