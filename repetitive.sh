echo "Removing Lock File =====> "
rm -r package-lock.json
echo "Lock File Removed =====> "

echo "Removing Node Modules =====> "
rm -r node_modules 
echo "Node Modules Removed =====> "

echo "Installing Node Modules Again =====> "
npm i -f
echo "Node Modules Installed =====> "

echo "Building App =====> "
npm run android

