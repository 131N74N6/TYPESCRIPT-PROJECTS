import type { UserOpinion } from '../custom-types';

export default function CommentList(commentsContainer: HTMLElement, comments: UserOpinion[]): void {
    comments.forEach(comment => {
        const commentUploader = document.createElement('strong') as HTMLElement;
        commentUploader.className = 'text-gray-800';
        commentUploader.textContent = comment.username;

        const opinions = document.createElement('p') as HTMLParagraphElement;
        opinions.className = 'text-gray-600';
        opinions.textContent = comment.opinions;

        const contentWrap = document.createElement('div') as HTMLDivElement;
        contentWrap.append(commentUploader, opinions);

        const createdAt = document.createElement('span') as HTMLElement;
        createdAt.className = 'text-gray-400 text-sm';
        createdAt.textContent = new Date(comment.created_at).toLocaleTimeString();

        const commentList = document.createElement('div') as HTMLDivElement;
        commentList.className = 'flex justify-between items-start';
        commentList.append(contentWrap, createdAt);

        const commentElement = document.createElement('div');
        commentElement.className = 'bg-gray-50 p-[1rem] rounded-lg';
        commentElement.append(commentList);
        commentsContainer.appendChild(commentElement);
    });
}