$images = Get-ChildItem -Path ".\" -Recurse -Include *.jpg, *.png, *.jpeg

foreach ($image in $images) {
  if ($image.DirectoryName -match "logo" -or $image.DirectoryName -match "static") {
    continue
  }
  # Convert with cwebp
  $output = $image.DirectoryName + "\" + $image.BaseName + ".webp"
  cwebp -q 50 $image.FullName -o $output
  # Delete origianl image
  Remove-Item $image.FullName
}

# Replace all image paths in .md files
$files = Get-ChildItem -Path ".\" -Recurse -Include *.md, *.toml

foreach ($file in $files) {
  if ($file.Name -eq "logo.md" -or $file.Name -eq "README.md") {
    continue
  }
  Write-Host "Processing $($file.Name)..."
  $content = Get-Content $file.FullName
  $content = $content -replace ".jpg", ".webp"
  $content = $content -replace ".png", ".webp"
  $content = $content -replace ".jpeg", ".webp"
  Set-Content $file.FullName $content
}
