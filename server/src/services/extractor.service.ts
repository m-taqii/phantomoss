export default async function urlReader(url: string) {
    const data = await fetch(`https://r.jina.ai/${url}`)

    return data.text()
}